import nodemailer, { Transporter } from 'nodemailer';

/**
 * Lazily-initialised singleton Nodemailer transporter based on environment variables.
 */
let cachedTransport: Transporter | null = null;

function getTransport(): Transporter {
  if (cachedTransport) return cachedTransport;

  const { EMAIL_SMTP_USER, EMAIL_SMTP_PASS } = process.env;
  if (!EMAIL_SMTP_USER || !EMAIL_SMTP_PASS) {
    throw new Error('EMAIL_SMTP_USER and EMAIL_SMTP_PASS must be set');
  }

  cachedTransport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // use STARTTLS
    auth: {
      user: EMAIL_SMTP_USER,
      pass: EMAIL_SMTP_PASS,
    },
  });

  return cachedTransport;
}

/**
 * Send a plain-text email notifying of a new user sign-up.
 */
export async function sendSignupNotification(params: {
  email: string;
  name?: string | null;
}): Promise<void> {
  const { email, name } = params;
  const transporter = getTransport();

  const textLines = ['New user signed up!', `Email: ${email}`];
  if (name) textLines.push(`Name: ${name}`);
  textLines.push(`Timestamp: ${new Date().toISOString()}`);

  await transporter.sendMail({
    from: process.env.EMAIL_SMTP_USER,
    to: process.env.NOTIFICATIONS_EMAIL_TO,
    subject: `AI Calendar Helper – New user signup: ${email}`,
    text: textLines.join('\n'),
  });
}

/**
 * Send the daily usage report.
 * @param reportText Pre-formatted plain-text body (e.g., table of usage lines).
 */
export async function sendDailyUsageReport(reportText: string): Promise<void> {
  const transporter = getTransport();

  await transporter.sendMail({
    from: process.env.EMAIL_SMTP_USER,
    to: process.env.NOTIFICATIONS_EMAIL_TO,
    subject: `AI Calendar Helper – Daily usage report – ${new Date().toLocaleDateString('en-CA')}`,
    text: reportText,
  });
}

/**
 * Send a plain-text email listing novel events to the user.
 */
export async function sendNovelEventsReport(params: {
  to: string;
  events: Array<{
    summary?: string | null;
    start?: string | null;
    noveltyScore: number;
    calendarId?: string;
  }>;
  windowStart?: Date;
  windowEnd?: Date;
  calendarNames?: Record<string, string>;
}): Promise<void> {
  const { to, events, windowStart, windowEnd, calendarNames = {} } = params;
  const transporter = getTransport();

  const daysWindow =
    windowStart && windowEnd
      ? Math.round((windowEnd.getTime() - windowStart.getTime()) / 864e5)
      : 14;

  // Deduplicate events that appear across multiple calendars
  const deduplicatedEvents = deduplicateEvents(events, calendarNames);

  const lines: string[] = [
    `Novel events in next ${daysWindow} days:`,
    '',
    `Generated: ${new Date().toLocaleString('en-CA', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}`,
    '',
  ];

  if (deduplicatedEvents.length === 0) {
    lines.push('No novel events found in the current look-ahead window.');
  } else {
    deduplicatedEvents.forEach((ev, idx) => {
      const { textLine } = renderEvent(ev, idx, calendarNames);
      lines.push(textLine);
    });
  }

  // Build HTML body mirroring the text version but with bold titles
  const htmlParts: string[] = [];
  htmlParts.push(`<p><strong>Novel events in next ${daysWindow} days:</strong></p>`);
  htmlParts.push(
    `<p>Generated: ${new Date().toLocaleString('en-CA', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}</p>`
  );

  if (deduplicatedEvents.length === 0) {
    htmlParts.push('<p>No novel events found in the current look-ahead window.</p>');
  } else {
    deduplicatedEvents.forEach((ev, idx) => {
      const { htmlLine } = renderEvent(ev, idx, calendarNames);
      htmlParts.push(htmlLine);
    });
  }

  await transporter.sendMail({
    from: process.env.EMAIL_SMTP_USER,
    to,
    subject: `AI Calendar Helper – Novel Events Report (${deduplicatedEvents.length} event${deduplicatedEvents.length === 1 ? '' : 's'})`,
    text: lines.join('\n'),
    html: htmlParts.join('\n'),
  });

  if (process.env.NODE_ENV !== 'production') {
    console.debug('[DEBUG] Novel events email', { to, lines });
  }

  /**
   * Deduplicate events that appear across multiple calendars.
   * Groups events by title and start time, combining calendar names.
   */
  function deduplicateEvents(
    events: Array<{
      summary?: string | null;
      start?: string | null;
      noveltyScore: number;
      calendarId?: string;
    }>,
    calNames: Record<string, string>
  ): Array<{
    summary?: string | null;
    start?: string | null;
    noveltyScore: number;
    calendarId?: string;
    combinedCalendars?: string[];
  }> {
    const eventMap = new Map<
      string,
      {
        event: (typeof events)[0];
        calendars: string[];
        maxNoveltyScore: number;
      }
    >();

    // Group events by title + start time
    events.forEach(event => {
      const title = (event.summary ?? 'Untitled event').trim();
      const startTime = event.start ?? 'Unknown';
      const key = `${title}|${startTime}`;

      const calendarName = calNames[event.calendarId ?? ''] ?? event.calendarId ?? 'Unknown Cal';

      if (eventMap.has(key)) {
        const existing = eventMap.get(key);
        if (existing) {
          // Add calendar to the list if not already present
          if (!existing.calendars.includes(calendarName)) {
            existing.calendars.push(calendarName);
          }
          // Keep the highest novelty score
          existing.maxNoveltyScore = Math.max(existing.maxNoveltyScore, event.noveltyScore);
        }
      } else {
        eventMap.set(key, {
          event: { ...event },
          calendars: [calendarName],
          maxNoveltyScore: event.noveltyScore,
        });
      }
    });

    // Convert back to event list, maintaining chronological order
    const result = Array.from(eventMap.values())
      .map(({ event, calendars, maxNoveltyScore }) => ({
        ...event,
        noveltyScore: maxNoveltyScore,
        combinedCalendars: calendars,
      }))
      .sort((a, b) => {
        if (!a.start || !b.start) return 0;
        return new Date(a.start).getTime() - new Date(b.start).getTime();
      });

    return result;
  }

  /**
   * Helper to render one event into text and HTML forms (with bold title).
   */
  function renderEvent(
    ev: {
      summary?: string | null;
      start?: string | null;
      noveltyScore: number;
      calendarId?: string;
      combinedCalendars?: string[];
    },
    idx: number,
    calNames: Record<string, string>
  ): { textLine: string; htmlLine: string } {
    const d = ev.start ? new Date(ev.start) : null;
    const datePrefix = d
      ? d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: '2-digit' }) +
        ' ' +
        d.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' })
      : 'Unknown';

    // Use combined calendars if available, otherwise fall back to single calendar
    const calName =
      ev.combinedCalendars && ev.combinedCalendars.length > 0
        ? ev.combinedCalendars.join(', ')
        : (calNames[ev.calendarId ?? ''] ?? ev.calendarId ?? 'Unknown Cal');

    const title = ev.summary ?? 'Untitled event';
    const novelPct = (ev.noveltyScore * 100).toFixed(0);

    return {
      textLine: `${idx + 1}. ${datePrefix} ${title} [${calName}] (novelty ${novelPct}%)`,
      htmlLine: `<p>${idx + 1}. ${datePrefix} <strong>${title}</strong> [${calName}] (novelty ${novelPct}%)</p>`,
    };
  }
}

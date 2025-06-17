// utility to build provider-specific "Add to Calendar" links and raw ICS content
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

// Basic location → timezone mapping for common cases where the LLM leaves timezone ambiguous.
// This is **not** exhaustive—just a pragmatic fallback so ferry bookings like
// "Vancouver (Tsawwassen)" get America/Vancouver instead of the local browser zone.
const LOCATION_TIMEZONE_MAP: Record<string, string> = {
  vancouver: 'America/Vancouver',
  tsawwassen: 'America/Vancouver',
  'salt spring island': 'America/Vancouver', // same zone as Vancouver
  victoria: 'America/Vancouver',
  calgary: 'America/Edmonton',
  edmonton: 'America/Edmonton',
};

function guessTimezone(fallback: string | undefined, location?: string): string {
  if (location) {
    const key = location.toLowerCase();
    for (const fragment in LOCATION_TIMEZONE_MAP) {
      if (key.includes(fragment)) {
        return LOCATION_TIMEZONE_MAP[fragment];
      }
    }
  }

  if (fallback && /\//.test(fallback)) return fallback; // use provided if no location match

  // Final fallback to browser guess
  return dayjs.tz.guess();
}

export interface CalendarEvent {
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm (24-hour) optional
  durationMinutes?: number; // defaults to 60
  location?: string;
  description?: string;
  timezone?: string; // IANA timezone to treat date/time as
}

export interface AddToCalendarLinks {
  google: string;
  outlook: string;
  ics: string; // raw ICS content – caller can wrap in data URI
}

export function generateAddToCalendarLinks(event: CalendarEvent): AddToCalendarLinks {
  const duration = event.durationMinutes ?? 60;
  const tz = guessTimezone(event.timezone, event.location);
  // Build start & end times in UTC ISO strings without punctuation for Google
  const localStart = event.time
    ? dayjs.tz(`${event.date} ${event.time}`, 'YYYY-MM-DD HH:mm', tz)
    : dayjs.tz(event.date, 'YYYY-MM-DD', tz);
  // For all-day events ensure we begin at midnight
  const start = event.time ? localStart : localStart.startOf('day');
  const end = start.add(duration, 'minute');

  const startUTC = start.utc();
  const endUTC = end.utc();

  const googleTime = `${startUTC.format('YYYYMMDDTHHmmss')}Z/${endUTC.format('YYYYMMDDTHHmmss')}Z`;

  const encodedDesc = encodeURIComponent(event.description ?? '');
  const google = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    event.title
  )}&dates=${googleTime}&details=${encodedDesc}&location=${encodeURIComponent(
    event.location ?? ''
  )}&ctz=${encodeURIComponent(tz)}`;

  const outlook = `https://outlook.office.com/calendar/0/deeplink/compose?rru=addevent&subject=${encodeURIComponent(
    event.title
  )}&body=${encodedDesc}&startdt=${encodeURIComponent(
    startUTC.format()
  )}&enddt=${encodeURIComponent(endUTC.format())}&location=${encodeURIComponent(
    event.location ?? ''
  )}&ctz=${encodeURIComponent(tz)}`;

  // Helper to escape special characters per RFC 5545 (comma, semicolon, newline)
  const escapeICSText = (text: string): string =>
    text.replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AI Calendar Helper//EN',
    `X-WR-TIMEZONE:${tz}`,
    'BEGIN:VEVENT',
    `UID:${Math.random().toString(36).slice(2)}@ai-calendar-helper`,
    `DTSTAMP:${dayjs().utc().format('YYYYMMDDTHHmmss')}Z`,
    `DTSTART;TZID=${tz}:${start.format('YYYYMMDDTHHmmss')}`,
    `DTEND;TZID=${tz}:${end.format('YYYYMMDDTHHmmss')}`,
    `SUMMARY:${escapeICSText(event.title)}`,
    event.description ? `DESCRIPTION:${escapeICSText(event.description)}` : '',
    event.location ? `LOCATION:${escapeICSText(event.location)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  const ics = icsLines.join('\r\n');

  return { google, outlook, ics };
}

export { guessTimezone };

// Build full description by combining parsed description and original text (if any)
export function buildEventDescription(parsedDesc?: string, originalText?: string): string {
  let desc = (parsedDesc || '').trim();
  const raw = (originalText || '').trim();
  if (raw) {
    if (desc) desc += '\n\n';
    desc += '--- Original Text ---\n\n' + raw;
  }
  return desc;
}

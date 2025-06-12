// utility to build provider-specific "Add to Calendar" links and raw ICS content
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export interface CalendarEvent {
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm (24-hour) optional
  durationMinutes?: number; // defaults to 60
  location?: string;
  description?: string;
}

export interface AddToCalendarLinks {
  google: string;
  outlook: string;
  ics: string; // raw ICS content – caller can wrap in data URI
}

export function generateAddToCalendarLinks(event: CalendarEvent): AddToCalendarLinks {
  const duration = event.durationMinutes ?? 60;
  // Build start & end times in UTC ISO strings without punctuation for Google
  const localStart = event.time ? dayjs(`${event.date} ${event.time}`) : dayjs(event.date);
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
  )}`;

  const outlook = `https://outlook.office.com/calendar/0/deeplink/compose?rru=addevent&subject=${encodeURIComponent(
    event.title
  )}&body=${encodedDesc}&startdt=${encodeURIComponent(
    startUTC.format()
  )}&enddt=${encodeURIComponent(endUTC.format())}&location=${encodeURIComponent(event.location ?? '')}`;

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AI Calendar Helper//EN',
    'BEGIN:VEVENT',
    `UID:${Math.random().toString(36).slice(2)}@ai-calendar-helper`,
    `DTSTAMP:${dayjs().utc().format('YYYYMMDDTHHmmss')}Z`,
    `DTSTART:${startUTC.format('YYYYMMDDTHHmmss')}Z`,
    `DTEND:${endUTC.format('YYYYMMDDTHHmmss')}Z`,
    `SUMMARY:${event.title}`,
    event.description ? `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}` : '',
    event.location ? `LOCATION:${event.location}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  const ics = icsLines.join('\r\n');

  return { google, outlook, ics };
}

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

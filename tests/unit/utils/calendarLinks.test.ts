import { generateAddToCalendarLinks, buildEventDescription } from '@/lib/utils/calendarLinks';

describe('generateAddToCalendarLinks', () => {
  const baseEvent = {
    title: 'Board Meeting',
    date: '2025-06-01',
    time: '14:00',
    location: 'Conference Room',
    description: 'Quarterly board meeting',
  } as const;

  it('produces Google link with encoded parameters', () => {
    const links = generateAddToCalendarLinks(baseEvent);
    expect(links.google).toContain('https://calendar.google.com/calendar/render?action=TEMPLATE');
    expect(links.google).toContain(encodeURIComponent(baseEvent.title));
    expect(links.google).toContain(encodeURIComponent(baseEvent.location));
  });

  it('produces Outlook link with encoded parameters', () => {
    const links = generateAddToCalendarLinks(baseEvent);
    expect(links.outlook).toContain('https://outlook.office.com/calendar/0/deeplink/compose');
    expect(links.outlook).toContain(encodeURIComponent(baseEvent.title));
    expect(links.outlook).toContain(encodeURIComponent(baseEvent.location));
  });

  it('produces valid ICS content', () => {
    const { ics } = generateAddToCalendarLinks(baseEvent);
    expect(ics.startsWith('BEGIN:VCALENDAR')).toBe(true);
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain(`SUMMARY:${baseEvent.title}`);
  });

  it('includes original text in Outlook link', () => {
    const desc = 'Short summary';
    const raw = 'Full raw input';
    const fullDesc = buildEventDescription(desc, raw);
    const links = generateAddToCalendarLinks({ ...baseEvent, description: fullDesc });
    expect(decodeURIComponent(links.outlook)).toContain(raw);
  });
});

import { generateAddToCalendarLinks } from '@/lib/utils/calendarLinks';

describe('generateAddToCalendarLinks with explicit timezone', () => {
  it('handles date-only event with timezone correctly', () => {
    const event = {
      title: 'All-day Paris conference',
      date: '2025-03-10',
      durationMinutes: 60 * 8,
      location: 'Paris',
      timezone: 'Europe/Paris',
    } as const;

    const links = generateAddToCalendarLinks(event);

    // Should not throw and must include VEVENT lines
    expect(links.ics).toContain('BEGIN:VEVENT');
    expect(links.ics).toContain('DTSTART:');
    // Google link contains Z suffix (UTC)
    expect(links.google).toMatch(/Z/);
  });

  it('handles date+time event with timezone', () => {
    const event = {
      title: 'Tokyo call',
      date: '2025-06-01',
      time: '09:00',
      durationMinutes: 30,
      location: 'Zoom',
      timezone: 'Asia/Tokyo',
    };

    const { outlook } = generateAddToCalendarLinks(event);
    // Outlook link should include encoded startdt parameter
    expect(outlook).toMatch(/startdt=/);
  });
});

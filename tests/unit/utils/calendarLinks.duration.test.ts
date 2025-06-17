import { generateAddToCalendarLinks } from '@/lib/utils/calendarLinks';

describe('generateAddToCalendarLinks duration handling', () => {
  it('respects durationMinutes when provided', () => {
    const links = generateAddToCalendarLinks({
      title: 'Test Event',
      date: '2025-07-02',
      time: '10:25',
      timezone: 'America/Vancouver',
      durationMinutes: 175, // 2h55m
    });

    // 10:25 PT = 17:25Z, add 175 min => 20:20Z
    expect(links.google).toContain('20250702T172500Z/20250702T202000Z');
    expect(links.outlook).toContain('enddt=2025-07-02T20%3A20%3A00Z');
    expect(links.ics).toContain('DTEND;TZID=America/Vancouver:20250702T132000');
  });
});

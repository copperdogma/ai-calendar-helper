import { generateAddToCalendarLinks, guessTimezone } from '@/lib/utils/calendarLinks';

// These tests run in the Node environment (no jsdom needed)
describe('guessTimezone location inference', () => {
  it('maps Vancouver/Tsawwassen to America/Vancouver', () => {
    expect(guessTimezone(undefined, 'Vancouver (Tsawwassen)')).toBe('America/Vancouver');
  });

  it('maps Salt Spring Island to America/Vancouver', () => {
    expect(guessTimezone(undefined, 'Salt Spring Island')).toBe('America/Vancouver');
  });

  it('maps Calgary to America/Edmonton', () => {
    expect(guessTimezone(undefined, 'Calgary')).toBe('America/Edmonton');
  });
});

describe('generateAddToCalendarLinks with inferred timezone', () => {
  it('calculates correct UTC times when timezone inferred from location', () => {
    const links = generateAddToCalendarLinks({
      title: 'Ferry Departure',
      date: '2025-07-02',
      time: '10:25',
      location: 'Vancouver (Tsawwassen)',
      description: 'Test',
      // timezone intentionally omitted to force inference
    });

    // 10:25 Pacific Daylight Time (UTC-7) => 17:25Z
    expect(links.google).toContain('20250702T172500Z');
    expect(links.google).toContain('ctz=America%2FVancouver');
    expect(links.outlook).toContain('2025-07-02T17%3A25%3A00Z');
    expect(links.outlook).toContain('ctz=America%2FVancouver');
    // ensure ICS content uses same stamp
    expect(links.ics).toContain('DTSTART;TZID=America/Vancouver:20250702T102500');
  });
});

import { EventPattern, CalendarEventLike } from '../../../../lib/novelEvents/EventPattern';

describe('EventPattern', () => {
  const basePattern = new EventPattern({
    title: 'Team Meeting',
    dayOfWeek: 1, // Monday
    hour: 9,
    minute: 0,
    calendarId: 'work',
    frequency: 10,
  });

  const makeEvent = (overrides: Partial<CalendarEventLike>): CalendarEventLike => {
    return {
      title: 'Team Meeting',
      start: new Date('2025-01-06T09:00:00Z'), // Monday 9:00
      calendarId: 'work',
      ...overrides,
    };
  };

  it('matches identical event', () => {
    expect(basePattern.isSimilarTo(makeEvent({}))).toBe(true);
  });

  it('rejects different calendar', () => {
    expect(basePattern.isSimilarTo(makeEvent({ calendarId: 'personal' }))).toBe(false);
  });

  it('rejects event more than 1h away', () => {
    expect(basePattern.isSimilarTo(makeEvent({ start: new Date('2025-01-06T11:30:00Z') }))).toBe(
      false
    );
  });

  it('allows within 60 minute window', () => {
    expect(basePattern.isSimilarTo(makeEvent({ start: new Date('2025-01-06T09:55:00Z') }))).toBe(
      true
    );
  });

  it('requires exact title when low frequency', () => {
    const lowFreqPattern = new EventPattern({
      ...basePattern,
      frequency: 5,
    });
    expect(lowFreqPattern.isSimilarTo(makeEvent({ title: 'Team Mtg' }))).toBe(false);
  });

  it('allows partial match when high frequency and long titles', () => {
    const highFreqPattern = new EventPattern({
      ...basePattern,
      frequency: 20,
    });
    expect(highFreqPattern.isSimilarTo(makeEvent({ title: 'Team Meeting Q1' }))).toBe(true);
    expect(highFreqPattern.score).toBe(1);
  });
});

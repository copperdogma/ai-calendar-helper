export interface CalendarEventLike {
  title?: string | null;
  start: Date | null;
  calendarId: string;
}

/**
 * EventPattern mirrors the behaviour of the Swift `EventPattern` struct.
 * It captures a frequently-occuring event (title + weekday/time bucket) so that
 * we can score similarity of upcoming events.
 */
export class EventPattern {
  readonly title: string;
  readonly dayOfWeek: number | null; // 0 (Sunday) – 6 (Saturday) or null if ignored
  readonly hour: number;
  readonly minute: number;
  readonly calendarId: string;
  readonly frequency: number;

  constructor(args: {
    title: string;
    dayOfWeek: number | null;
    hour: number;
    minute: number;
    calendarId: string;
    frequency: number;
  }) {
    this.title = args.title;
    this.dayOfWeek = args.dayOfWeek;
    this.hour = args.hour;
    this.minute = args.minute;
    this.calendarId = args.calendarId;
    this.frequency = args.frequency;
  }

  /**
   * Score is frequency normalised to 0–1 (≥12 occurrences ⇒ 1.0).
   */
  get score(): number {
    return Math.min(this.frequency / 12, 1);
  }

  /**
   * Determines whether the provided event looks similar to this pattern.
   * Rules replicated from the Swift implementation.
   */
  isSimilarTo(event: CalendarEventLike): boolean {
    if (!event.start || !event.title) return false;
    if (event.calendarId !== this.calendarId) return false;

    // Determine day of week (0–6) in passed timezone or local timezone.
    const eventDate = event.start;
    const weekday = eventDate.getUTCDay();

    if (this.dayOfWeek !== null && weekday !== this.dayOfWeek) {
      return false;
    }

    // Time within ±60 minutes.
    const eventMinutes = eventDate.getUTCHours() * 60 + eventDate.getUTCMinutes();
    const patternMinutes = this.hour * 60 + this.minute;
    if (Math.abs(eventMinutes - patternMinutes) > 60) {
      return false;
    }

    const eventTitle = event.title.toLowerCase();
    const patternTitle = this.title.toLowerCase();

    if (this.frequency >= 12) {
      if (eventTitle.length <= 5 || patternTitle.length <= 5) {
        return eventTitle === patternTitle;
      }
      return eventTitle.includes(patternTitle) || patternTitle.includes(eventTitle);
    }

    return eventTitle === patternTitle;
  }
}

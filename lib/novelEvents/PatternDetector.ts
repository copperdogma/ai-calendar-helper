import { EventPattern, CalendarEventLike } from "./EventPattern";

export class PatternDetector {
  private patterns: EventPattern[] = [];

  /**
   * Build frequency-weighted patterns from historical events.
   */
  analyzeEvents(events: CalendarEventLike[]): void {
    const patternMap: Record<string, number> = {};
    const getKey = (e: CalendarEventLike): string | null => {
      if (!e.start || !e.title) return null;
      const calId = e.calendarId;
      const title = e.title;
      const date = e.start;
      const day = date.getUTCDay(); // 0-6
      const hour = date.getUTCHours();
      const minute = date.getUTCMinutes();
      const isTeaching = title.toLowerCase().includes("teaching");
      if (isTeaching) {
        return `teaching|${hour}:${minute}|${title}|${calId}`;
      }
      return `regular|${day}|${hour}:${minute}|${title}|${calId}`;
    };

    events.forEach((ev) => {
      const key = getKey(ev);
      if (!key) return;
      patternMap[key] = (patternMap[key] ?? 0) + 1;
    });

    // convert to EventPattern instances
    this.patterns = Object.entries(patternMap).map(([key, freq]) => {
      const comps = key.split("|");
      const patternType = comps[0];
      const calendarId = comps[comps.length - 1];
      const title = comps[comps.length - 2];
      const timePart = comps[patternType === "teaching" ? 1 : 2];
      const [hrStr, minStr] = timePart.split(":");
      const hour = parseInt(hrStr, 10);
      const minute = parseInt(minStr, 10);
      let dayOfWeek: number | null = null;
      if (patternType === "regular") {
        dayOfWeek = parseInt(comps[1], 10);
      }
      return new EventPattern({
        title,
        dayOfWeek,
        hour,
        minute,
        calendarId,
        frequency: freq,
      });
    });
  }

  /**
   * Returns max pattern score that matches given event, or 0 if none match.
   */
  getPatternScore(event: CalendarEventLike): number {
    if (this.patterns.length === 0) return 0;
    const matches = this.patterns.filter((p) => p.isSimilarTo(event));
    if (matches.length === 0) return 0;
    return Math.max(...matches.map((p) => p.score));
  }

  getPatterns() {
    return this.patterns;
  }
} 
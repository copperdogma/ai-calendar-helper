import { PatternDetector } from "./PatternDetector";
import { CalendarEventLike } from "./EventPattern";

export interface NovelEvent {
  event: CalendarEventLike;
  noveltyScore: number; // 1 - patternScore
  reason: string;
}

export class NoveltyAnalyzer {
  constructor(private detector: PatternDetector, private threshold = 0.2) {}

  findNovelEvents(events: CalendarEventLike[]): NovelEvent[] {
    const novel: NovelEvent[] = [];

    events.forEach((ev) => {
      const score = this.detector.getPatternScore(ev);
      if (score < this.threshold) {
        novel.push({
          event: ev,
          noveltyScore: 1 - score,
          reason: "Event occurs infrequently in your calendar",
        });
      }
    });

    return novel.sort((a, b) => {
      if (!a.event.start || !b.event.start) return 0;
      return a.event.start.getTime() - b.event.start.getTime();
    });
  }
} 
import { PatternDetector } from "../../../../lib/novelEvents/PatternDetector";
import { CalendarEventLike } from "../../../../lib/novelEvents/EventPattern";

describe("PatternDetector", () => {
  const historical: CalendarEventLike[] = [
    {
      title: "Standup",
      start: new Date("2025-01-06T10:00:00Z"), // Monday
      calendarId: "work",
    },
    {
      title: "Standup",
      start: new Date("2025-01-13T10:05:00Z"), // next Monday
      calendarId: "work",
    },
    {
      title: "Teaching Class",
      start: new Date("2025-01-07T14:00:00Z"),
      calendarId: "work",
    },
    {
      title: "Teaching Class",
      start: new Date("2025-01-08T14:05:00Z"),
      calendarId: "work",
    },
  ];

  it("creates patterns and scores matching event", () => {
    const pd = new PatternDetector();
    pd.analyzeEvents(historical);

    // upcoming standup Monday 10:00
    const upcoming: CalendarEventLike = {
      title: "Standup",
      start: new Date("2025-01-20T10:02:00Z"),
      calendarId: "work",
    };
    const score = pd.getPatternScore(upcoming);
    expect(score).toBeGreaterThan(0);
  });

  it("returns 0 for unrelated event", () => {
    const pd = new PatternDetector();
    pd.analyzeEvents(historical);
    const unrelated: CalendarEventLike = {
      title: "Offsite",
      start: new Date("2025-01-09T09:00:00Z"),
      calendarId: "work",
    };
    expect(pd.getPatternScore(unrelated)).toBe(0);
  });
}); 
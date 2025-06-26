import { CalendarService } from "../google/calendarService";
import { PatternDetector } from "./PatternDetector";
import { NoveltyAnalyzer, NovelEvent } from "./NoveltyAnalyzer";
import { PrismaClient } from "@prisma/client";

export interface NovelEventsDeps {
  prisma: PrismaClient;
  calendarService: CalendarService;
}

export async function detectNovelEvents(
  userId: string,
  deps: NovelEventsDeps,
): Promise<NovelEvent[]> {
  const { prisma, calendarService } = deps;

  // 1. Load user settings or defaults
  const settings: any = await (prisma as any).userSettings.findUnique({
    where: { userId },
  });

  const lookAheadDays = settings?.lookAheadDays ?? 14;
  const threshold = Number(settings?.noveltyThreshold ?? 0.2);

  // 2. Determine date ranges
  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const lookAheadDate = new Date(now);
  lookAheadDate.setDate(lookAheadDate.getDate() + lookAheadDays);

  // 3. Fetch or create sync state (primary calendar for now)
  let syncState: any = await (prisma as any).calendarSyncState.findUnique({
    where: { userId_calendarId: { userId, calendarId: "primary" } },
  });

  // 4. Fetch historical events (may use syncToken if present)
  const hist = await calendarService.fetchEvents({
    start: oneYearAgo,
    end: now,
    syncToken: syncState?.syncToken ?? undefined,
  });

  // Save new sync token
  if (hist.nextSyncToken) {
    if (syncState) {
      await (prisma as any).calendarSyncState.update({
        where: { id: syncState.id },
        data: { syncToken: hist.nextSyncToken },
      });
    } else {
      await (prisma as any).calendarSyncState.create({
        data: {
          userId,
          calendarId: "primary",
          syncToken: hist.nextSyncToken,
        },
      });
    }
  }

  // 5. Fetch upcoming events
  const upcoming = await calendarService.fetchEvents({
    start: now,
    end: lookAheadDate,
  });

  // 6. Analyze patterns & novelty
  const detector = new PatternDetector();
  detector.analyzeEvents(
    hist.events.map((e) => ({
      title: e.summary ?? null,
      start: e.start ? new Date(e.start) : null,
      calendarId: e.calendarId,
    })),
  );

  const analyzer = new NoveltyAnalyzer(detector, threshold);
  const novel = analyzer.findNovelEvents(
    upcoming.events.map((e) => ({
      title: e.summary ?? null,
      start: e.start ? new Date(e.start) : null,
      calendarId: e.calendarId,
    })),
  );

  return novel;
} 
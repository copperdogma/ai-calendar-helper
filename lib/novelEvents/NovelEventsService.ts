/* eslint-disable @typescript-eslint/no-explicit-any */

import { CalendarService, GoogleCalendarClient } from '../google/calendarService';
import { PatternDetector } from './PatternDetector';
import { NoveltyAnalyzer, NovelEvent } from './NoveltyAnalyzer';
import { PrismaClient } from '@prisma/client';
import { CacheService } from '../services/cache.service';
import { EventPattern } from './EventPattern';

export interface NovelEventsDeps {
  prisma: PrismaClient;
  calendarClient: GoogleCalendarClient;
}

export async function detectNovelEvents(
  userId: string,
  deps: NovelEventsDeps
): Promise<NovelEvent[]> {
  const { prisma, calendarClient } = deps;

  // 1. Load user settings or defaults
  const settings: any = await (prisma as any).userSettings.findUnique({
    where: { userId },
  });

  const lookAheadDays = settings?.lookAheadDays ?? 14;
  const threshold = Number(settings?.noveltyThreshold ?? 0.2);
  const storePattern: boolean = settings?.storePattern !== false;
  const blacklist: string[] | undefined = settings?.blacklist ?? undefined;
  const whitelistInput: string[] | undefined = settings?.whitelist ?? undefined;

  // --- Resolve friendly calendar names to IDs ---

  let whitelist: string[] | undefined = whitelistInput;
  let blacklistIds: string[] | undefined = undefined;

  try {
    const calList = await calendarClient.listCalendars();
    const nameToId = new Map<string, string>();
    const norm = (s: string) => s.trim().toLowerCase();
    calList.items?.forEach((cal: any) => {
      if (cal.id) {
        if (cal.summary) nameToId.set(norm(cal.summary), cal.id);
        if (cal.summaryOverride) nameToId.set(norm(cal.summaryOverride), cal.id);
      }
    });

    if (whitelistInput && whitelistInput.length) {
      whitelist = whitelistInput.map(name => {
        if (name.includes('@')) return name; // already an id
        return nameToId.get(norm(name)) ?? name; // fall back to raw
      });
    }

    if (blacklist && blacklist.length) {
      blacklistIds = blacklist.map(name => {
        if (name.includes('@')) return name;
        return nameToId.get(norm(name)) ?? name;
      });
    }
  } catch (e) {
    console.warn('Failed to resolve calendar names via calendarList', e);
  }

  const hasWhitelist = Array.isArray(whitelist) && whitelist.length > 0;
  const isCalendarAllowed = (calendarId: string): boolean => {
    if (hasWhitelist) {
      // Always include primary; plus explicitly whitelisted calendars
      return calendarId === 'primary' || (whitelist as string[]).includes(calendarId);
    }
    if (Array.isArray(blacklistIds) && blacklistIds.length > 0) {
      // Always include primary; exclude blacklisted others
      if (calendarId === 'primary') return true;
      return !(blacklistIds as string[]).includes(calendarId);
    }
    return true; // no restrictions
  };

  const mapEvent = (e: any) => ({
    title: e.summary ?? null,
    start: e.start ? new Date(e.start) : null,
    calendarId: e.calendarId,
  });

  const filterMap = (events: any[]) =>
    events.filter(e => isCalendarAllowed(e.calendarId)).map(mapEvent);

  // 2. Determine date ranges
  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const lookAheadDate = new Date(now);
  lookAheadDate.setDate(lookAheadDate.getDate() + lookAheadDays);

  // 3. Fetch events across calendars (primary + whitelist)

  const calendarIds = ['primary', ...(whitelist ?? [])];

  const historicalEvents: any[] = [];
  const upcomingEvents: any[] = [];

  for (const calId of calendarIds) {
    // Apply blacklist/whitelist rules (primary always passes)
    if (!isCalendarAllowed(calId)) continue;

    const svc = new CalendarService(calendarClient, calId);

    // sync token row
    let syncState: any = await (prisma as any).calendarSyncState.findUnique({
      where: { userId_calendarId: { userId, calendarId: calId } },
    });

    // Historical
    let hist;
    try {
      hist = await svc.fetchEvents({
        start: oneYearAgo,
        end: now,
        syncToken: syncState?.syncToken ?? undefined,
      });
    } catch (err: any) {
      if (err?.code === 404) {
        console.warn(`Calendar ${calId} not found or inaccessible – skipping.`);
        continue; // skip to next calendar
      }
      throw err;
    }

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
            calendarId: calId,
            syncToken: hist.nextSyncToken,
          },
        });
      }
    }

    // Upcoming
    let upc;
    try {
      upc = await svc.fetchEvents({
        start: now,
        end: lookAheadDate,
      });
    } catch (err: any) {
      if (err?.code === 404) {
        console.warn(`Calendar ${calId} not found when fetching upcoming – skipping.`);
        continue;
      }
      throw err;
    }

    historicalEvents.push(...hist.events.map((e: any) => ({ ...e, calendarId: calId })));
    upcomingEvents.push(...upc.events.map((e: any) => ({ ...e, calendarId: calId })));
  }

  // 4. Analyze patterns & novelty (with optional cache)

  let detector: PatternDetector;

  const cacheKey = `patterns:${userId}`;

  if (storePattern) {
    const cached = await CacheService.get<any[]>(cacheKey);
    if (cached.hit && cached.value) {
      const patterns = cached.value.map(
        p =>
          new EventPattern({
            title: p.title,
            dayOfWeek: p.dayOfWeek,
            hour: p.hour,
            minute: p.minute,
            calendarId: p.calendarId,
            frequency: p.frequency,
          })
      );
      detector = new PatternDetector(patterns);
    } else {
      detector = new PatternDetector();
      detector.analyzeEvents(filterMap(historicalEvents));

      void CacheService.set(cacheKey, detector.getPatterns(), {
        ttl: 60 * 60 * 24,
        compress: true,
      });
    }
  } else {
    detector = new PatternDetector();
    detector.analyzeEvents(filterMap(historicalEvents));
  }

  const analyzer = new NoveltyAnalyzer(detector, threshold);
  const novel = analyzer.findNovelEvents(filterMap(upcomingEvents));

  return novel;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GoogleApiCalendarClient } from '@/lib/google/calendarService';
import { detectNovelEvents } from '@/lib/novelEvents/NovelEventsService';
// Email import moved to dynamic import to avoid build-time resolution
import { getUserOAuthClient } from '@/lib/google/getOAuthClient';

// This route runs novelty detection immediately and emails the results to the current user.
// Requires Google Calendar scope.

export async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // TODO: Replace with real Google API client in production.
  // For now, use a mock CalendarService from dependency injection tests or throw.
  // This avoids runtime dependency in dev environments lacking credentials.
  if (!('GOOGLE_CLIENT_ID' in process.env)) {
    return NextResponse.json({ error: 'Google Calendar API not configured' }, { status: 500 });
  }

  let oauthClient;
  try {
    oauthClient = await getUserOAuthClient(session.user.id, prisma);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  // Dynamically build the specifier so bundlers don't attempt to resolve at build-time

  let googleApi: any;
  try {
    googleApi = await eval("import('googleapis')");
  } catch {
    // Gracefully degrade when googleapis isn't available in local dev
    return NextResponse.json({
      ok: false,
      message: 'Google Calendar integration is not configured on this server.',
    });
  }
  const { google } = googleApi;

  const calendar = google.calendar({ version: 'v3', auth: oauthClient });
  const calendarClient = new GoogleApiCalendarClient(calendar as any);

  const novelEvents = await detectNovelEvents(session.user.id, {
    prisma,
    calendarClient,
  });

  // build id->name map for email formatting
  let calendarNames: Record<string, string> = {};
  try {
    const list = await calendarClient.listCalendars();
    list.items?.forEach((c: any) => {
      if (c.id) {
        calendarNames[c.id] = c.summaryOverride ?? c.summary ?? c.id;
      }
    });
  } catch {}

  // Dynamic import to avoid build-time nodemailer resolution
  const { sendNovelEventsReport } = await import('@/lib/email');

  await sendNovelEventsReport({
    to: session.user.email,
    events: novelEvents.map(n => ({
      summary: (n.event as any).title ?? null,
      start: (n.event as any).start?.toISOString?.() ?? null,
      noveltyScore: n.noveltyScore,
      calendarId: (n.event as any).calendarId ?? undefined,
    })),
    windowStart: new Date(),
    windowEnd: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 14); // use same default window as detection logic
      return d;
    })(),
    calendarNames,
  });

  return NextResponse.json({ sent: true, novelEvents });
}

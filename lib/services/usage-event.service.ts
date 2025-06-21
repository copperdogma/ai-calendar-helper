/* eslint-disable @typescript-eslint/no-explicit-any */

import { prisma } from '@/lib/prisma';

export type CalendarAction = 'google' | 'outlook' | 'ics' | null;
export type InputType = 'text' | 'image' | 'text+image';
export type DeviceType = 'mobile' | 'desktop';

export interface LogUsageEventParams {
  userId?: string;
  inputType: InputType;
  textSizeChars?: number;
  imageSizeBytes?: number;
  imageWidth?: number;
  imageHeight?: number;
  parseTimeMs?: number;
  eventsExtracted?: number;
  parseSuccess?: boolean;
  errorReason?: string | null;
  deviceType: DeviceType;
  os?: string;
  browser?: string;
  locale?: string;
  calendarAction?: CalendarAction;
}

/**
 * Insert a UsageEvent row capturing analytics for a calendar-parser interaction.
 * Optional fields default to null in the database when undefined.
 */
export async function logUsageEvent(params: LogUsageEventParams): Promise<void> {
  const {
    userId,
    inputType,
    textSizeChars,
    imageSizeBytes,
    imageWidth,
    imageHeight,
    parseTimeMs,
    eventsExtracted,
    parseSuccess,
    errorReason,
    deviceType,
    os,
    browser,
    locale,
    calendarAction,
  } = params;

  await (prisma as any).usageEvent.create({
    data: {
      userId: userId ?? null,
      inputType: mapInputType(inputType),
      textSizeChars,
      imageSizeBytes,
      imageWidth,
      imageHeight,
      parseTimeMs,
      eventsExtracted,
      parseSuccess,
      errorReason,
      deviceType: mapDeviceType(deviceType),
      os,
      browser,
      locale,
      calendarAction: mapCalendarAction(calendarAction),
    },
  });
}

// Helpers convert string union to Prisma enum values (upper-case names)
function mapInputType(type: InputType) {
  switch (type) {
    case 'text':
      return 'TEXT';
    case 'image':
      return 'IMAGE';
    case 'text+image':
      return 'TEXT_IMAGE';
    default:
      throw new Error(`Unknown inputType ${type}`);
  }
}

function mapDeviceType(type: DeviceType) {
  return type === 'mobile' ? 'MOBILE' : 'DESKTOP';
}

function mapCalendarAction(action?: CalendarAction | null) {
  if (!action) return null;
  switch (action) {
    case 'google':
      return 'GOOGLE';
    case 'outlook':
      return 'OUTLOOK';
    case 'ics':
      return 'ICS';
    default:
      throw new Error(`Unknown calendarAction ${action}`);
  }
}

export interface DailyUsageMetrics {
  totalRequests: number;
  successCount: number;
  failureCount: number;
  successRate: number; // 0-1
  avgParseTimeMs: number | null;
  avgEventsExtracted: number | null;
  inputTypeCounts: Record<InputType, number>;
}

/**
 * Aggregate daily usage metrics for a given UTC date (defaults to yesterday if not provided).
 */
export async function getDailyUsageMetrics(date: Date = new Date()): Promise<DailyUsageMetrics> {
  // Compute UTC day boundaries
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  const prismaClient: any = prisma;

  const [totalRequests, successCount, avgMetrics, groupByInput] = await Promise.all([
    prismaClient.usageEvent.count({ where: { createdAt: { gte: start, lt: end } } }),
    prismaClient.usageEvent.count({
      where: {
        createdAt: { gte: start, lt: end },
        parseSuccess: true,
      },
    }),
    prismaClient.usageEvent.aggregate({
      _avg: {
        parseTimeMs: true,
        eventsExtracted: true,
      },
      where: { createdAt: { gte: start, lt: end } },
    }),
    prismaClient.usageEvent.groupBy({
      by: ['inputType'],
      _count: { _all: true },
      where: { createdAt: { gte: start, lt: end } },
    }),
  ]);

  const inputTypeCounts: Record<InputType, number> = {
    text: 0,
    image: 0,
    'text+image': 0,
  } as Record<InputType, number>;
  for (const row of groupByInput) {
    switch (row.inputType) {
      case 'TEXT':
        inputTypeCounts['text'] = row._count._all;
        break;
      case 'IMAGE':
        inputTypeCounts['image'] = row._count._all;
        break;
      case 'TEXT_IMAGE':
        inputTypeCounts['text+image'] = row._count._all;
        break;
    }
  }

  const failureCount = totalRequests - successCount;

  return {
    totalRequests,
    successCount,
    failureCount,
    successRate: totalRequests ? successCount / totalRequests : 0,
    avgParseTimeMs: avgMetrics._avg.parseTimeMs ? Math.round(avgMetrics._avg.parseTimeMs) : null,
    avgEventsExtracted: avgMetrics._avg.eventsExtracted
      ? Math.round(avgMetrics._avg.eventsExtracted * 100) / 100
      : null,
    inputTypeCounts,
  };
}

export interface UsageTopRow {
  email: string | null;
  count: number;
}

/**
 * Return top users (or guest) based on UsageEvent table.
 * If userId is null we label as 'Guest'.
 */
export async function getTopUsersFromEvents(limit = 20): Promise<UsageTopRow[]> {
  const grouped: Array<{ userId: string | null; _count: { _all: number } }> = (await (
    prisma as any
  ).usageEvent.groupBy({
    by: ['userId'],
    _count: { _all: true },
  })) as any;

  // Sort in JS because Prisma ordering on _all not supported in some versions
  grouped.sort((a, b) => b._count._all - a._count._all);
  const top = grouped.slice(0, limit);

  return Promise.all(
    top.map(async g => {
      if (g.userId) {
        const user = await prisma.user.findUnique({ where: { id: g.userId } });
        return { email: user?.email ?? 'Unknown', count: g._count._all };
      }
      return { email: 'Guest', count: g._count._all };
    })
  );
}

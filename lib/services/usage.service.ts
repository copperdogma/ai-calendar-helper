import { prisma } from '@/lib/prisma';

type Service = 'CALENDAR_PARSER' | 'NOVEL_EVENTS_EXTRACTOR';

/**
 * Increment usage count for a user and service.
 */
export async function incrementUsage(params: {
  userId: string;
  service: Service;
  delta?: number;
}): Promise<void> {
  const { userId, service, delta = 1 } = params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).serviceUsage.upsert({
    where: {
      userId_service: {
        userId,
        service,
      },
    },
    create: {
      userId,
      service,
      count: delta,
    },
    update: {
      count: { increment: delta },
    },
  });
}

export interface UsageRow {
  email: string | null;
  count: number;
}

/**
 * Get top users for a given service.
 */
export async function getTopUsers(params: {
  service: Service;
  limit?: number;
}): Promise<UsageRow[]> {
  const { service, limit = 20 } = params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await (prisma as any).serviceUsage.findMany({
    where: { service },
    orderBy: { count: 'desc' },
    take: limit,
    include: {
      user: {
        select: { email: true },
      },
    },
  });

  type Row = { user: { email: string | null }; count: number };

  return (rows as Row[]).map(r => ({ email: r.user.email, count: r.count }));
}

import { incrementUsage, getTopUsers } from '@/lib/services/usage.service';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    serviceUsage: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe('usage service', () => {
  it('increments usage with upsert', async () => {
    await incrementUsage({ userId: 'u1', service: 'CALENDAR_PARSER' });
    expect((prisma as any).serviceUsage.upsert).toHaveBeenCalled();
  });

  it('getTopUsers maps correctly', async () => {
    ((prisma as any).serviceUsage.findMany as jest.Mock).mockResolvedValue([
      { count: 5, user: { email: 'a@example.com' } },
    ]);
    const rows = await getTopUsers({ service: 'CALENDAR_PARSER' });
    expect(rows[0]).toEqual({ email: 'a@example.com', count: 5 });
  });
});

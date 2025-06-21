import { getDailyUsageMetrics } from '@/lib/services/usage-event.service';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    usageEvent: {
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}));

describe('getDailyUsageMetrics', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('computes metrics correctly', async () => {
    // Mock counts and aggregates
    const mockCount = (prisma as any).usageEvent.count as jest.Mock;
    const mockAggregate = (prisma as any).usageEvent.aggregate as jest.Mock;
    const mockGroupBy = (prisma as any).usageEvent.groupBy as jest.Mock;

    mockCount
      .mockResolvedValueOnce(10) // totalRequests
      .mockResolvedValueOnce(8); // successCount

    mockAggregate.mockResolvedValue({ _avg: { parseTimeMs: 1500, eventsExtracted: 2 } });

    mockGroupBy.mockResolvedValue([
      { inputType: 'TEXT', _count: { _all: 6 } },
      { inputType: 'IMAGE', _count: { _all: 3 } },
      { inputType: 'TEXT_IMAGE', _count: { _all: 1 } },
    ]);

    const metrics = await getDailyUsageMetrics(new Date('2025-01-15T00:00:00Z'));

    expect(metrics).toEqual({
      totalRequests: 10,
      successCount: 8,
      failureCount: 2,
      successRate: 0.8,
      avgParseTimeMs: 1500,
      avgEventsExtracted: 2,
      inputTypeCounts: {
        text: 6,
        image: 3,
        'text+image': 1,
      },
    });
  });
});

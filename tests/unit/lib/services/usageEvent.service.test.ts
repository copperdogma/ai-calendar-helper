import { logUsageEvent } from '@/lib/services/usage-event.service';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    usageEvent: {
      create: jest.fn(),
    },
  },
}));

describe('logUsageEvent', () => {
  it('creates UsageEvent with mapped enum values', async () => {
    await logUsageEvent({
      inputType: 'text',
      deviceType: 'desktop',
      calendarAction: 'google',
      parseSuccess: true,
    });

    expect((prisma as any).usageEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          inputType: 'TEXT',
          deviceType: 'DESKTOP',
          calendarAction: 'GOOGLE',
        }),
      })
    );
  });

  it('handles other enum cases and nullables', async () => {
    await logUsageEvent({
      inputType: 'image',
      deviceType: 'mobile',
      calendarAction: null,
      imageSizeBytes: 2048,
      parseSuccess: false,
      errorReason: 'PARSE_ERROR',
    });

    expect((prisma as any).usageEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          inputType: 'IMAGE',
          deviceType: 'MOBILE',
          calendarAction: null,
          errorReason: 'PARSE_ERROR',
        }),
      })
    );
  });

  it('maps TEXT+IMAGE inputType and ICS action', async () => {
    await logUsageEvent({
      inputType: 'text+image',
      deviceType: 'desktop',
      calendarAction: 'ics',
    });

    expect((prisma as any).usageEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          inputType: 'TEXT_IMAGE',
          calendarAction: 'ICS',
        }),
      })
    );
  });
});

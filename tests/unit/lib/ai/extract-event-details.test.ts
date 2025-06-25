/**
 * @jest-environment node
 */

import { AIProcessingService } from '@/lib/ai';

jest.mock('@/lib/openaiResponse', () => ({
  createResponse: jest.fn(),
}));

const { createResponse } = jest.requireMock('@/lib/openaiResponse');

describe('AIProcessingService.extractEventDetails', () => {
  const svc = new AIProcessingService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns single event object when OpenAI responds with valid JSON', async () => {
    (createResponse as jest.Mock).mockResolvedValue({
      output_text: JSON.stringify({
        title: 'Demo',
        description: 'Presentation',
        startDate: '2025-09-30T14:00:00Z',
        endDate: '2025-09-30T15:00:00Z',
        location: 'Office',
        timezone: 'UTC',
        summary: 'Demo',
        confidence: { overall: 0.9, title: 0.9, description: 0.9, startDate: 0.9, endDate: 0.9, location: 0.9, timezone: 0.9 },
        isAllDay: false,
        recurrence: null,
      }),
    });

    const event = await svc.extractEventDetails('We will have a demo at 2pm UTC');
    expect(event.title).toBe('Demo');
    expect(createResponse).toHaveBeenCalled();
  });
}); 
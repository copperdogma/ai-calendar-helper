/**
 * @jest-environment node
 */

import { AIProcessingService, AIModel } from '@/lib/ai';

// Mock openaiResponse helper so no real API call happens
jest.mock('@/lib/openaiResponse', () => ({
  createResponse: jest.fn(),
}));

const { createResponse } = jest.requireMock('@/lib/openaiResponse');

describe('AIProcessingService.parseEventImage', () => {
  const service = new AIProcessingService(undefined, AIModel.GPT_4O_MINI);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return validated event data from the Responses API payload', async () => {
    const mockOutput = {
      title: 'Concert',
      description: 'Live music',
      startDate: '2025-12-31T20:00:00Z',
      endDate: '2026-01-01T00:00:00Z',
      location: 'Main Hall',
      timezone: 'UTC',
      summary: 'NYE Party',
      confidence: {
        title: 0.9,
        overall: 0.85,
      },
      isAllDay: false,
      recurrence: null,
    };

    (createResponse as jest.Mock).mockResolvedValue({
      output_text: JSON.stringify(mockOutput),
    });

    const fakeBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // tiny PNG header

    const result = await service.parseEventImage(fakeBuffer, { imageMime: 'image/png' });

    expect(result.title).toBe('Concert');
    expect(result.confidence.overall).toBeCloseTo(0.85);

    // Ensure Responses API called with JSON mode and vision content blocks
    expect(createResponse).toHaveBeenCalledTimes(1);
    const args = (createResponse as jest.Mock).mock.calls[0][0];
    expect(args.model).toBe(AIModel.GPT_4O_MINI);
    expect(args.text.format.type).toBe('json_object');
    expect(args.input[1].content[0].type).toBe('input_text');
    expect(args.input[1].content[1].type).toBe('input_image');
  });
}); 
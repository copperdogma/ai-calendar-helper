/**
 * @jest-environment node
 */

import { AIProcessingService, AIModel } from '@/lib/ai';

jest.mock('@/lib/openaiResponse', () => ({
  createResponse: jest.fn(),
}));

const { createResponse } = jest.requireMock('@/lib/openaiResponse');

describe('AIProcessingService.extractEvents', () => {
  const service = new AIProcessingService(undefined, AIModel.GPT_4O_MINI);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a validated array of events', async () => {
    const mockEvents = {
      events: [
        {
          title: 'Team Sync',
          description: 'Weekly call',
          startDate: '2025-07-01T09:00:00Z',
          endDate: '2025-07-01T10:00:00Z',
          location: 'Zoom',
          timezone: 'UTC',
          summary: 'Call',
          confidence: { overall: 0.9 },
          isAllDay: false,
          recurrence: null,
        },
      ],
    };

    (createResponse as jest.Mock).mockResolvedValue({
      output_text: JSON.stringify(mockEvents),
    });

    const result = await service.extractEvents('Team meeting at 9am UTC');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Team Sync');
    expect(createResponse).toHaveBeenCalledTimes(1);
  });

  it('should throw on invalid JSON from the model', async () => {
    (createResponse as jest.Mock).mockResolvedValue({ output_text: 'not-json' });
    await expect(service.extractEvents('Bad')).rejects.toThrow('Invalid JSON array from AI');
  });
}); 
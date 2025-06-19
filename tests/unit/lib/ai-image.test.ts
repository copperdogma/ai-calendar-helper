import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { AIProcessingService, OpenAIClient } from '../../../lib/ai';

/**
 * Unit tests for the new image-based event extraction helper
 */
describe('AIProcessingService.parseEventImage', () => {
  let aiService: AIProcessingService;
  let mockOpenAIClient: jest.Mocked<OpenAIClient>;

  beforeEach(() => {
    mockOpenAIClient = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    } as jest.Mocked<OpenAIClient>;

    aiService = new AIProcessingService(mockOpenAIClient);
  });

  it('should extract event details from a base64 image string', async () => {
    const mockEvent = {
      title: 'Conference',
      description: 'Tech conference',
      startDate: '2025-07-01T09:00:00Z',
      endDate: '2025-07-01T17:00:00Z',
      location: 'Convention Center',
      timezone: 'UTC',
      summary: 'Annual tech conference',
      confidence: {
        title: 0.9,
        description: 0.8,
        startDate: 0.95,
        endDate: 0.9,
        location: 0.7,
        timezone: 0.6,
        overall: 0.83,
      },
      isAllDay: false,
      recurrence: null,
    };

    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify(mockEvent),
          },
        },
      ],
    };

    // @ts-expect-error – relax type for jest mock
    (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue(mockResponse);

    const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAUA'; // truncated dummy data

    const result = await aiService.parseEventImage(base64Image);

    expect(result.title).toBe('Conference');
    expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalledTimes(1);
    expect((mockOpenAIClient.chat.completions.create as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        model: 'gpt-4o-mini',
      })
    );
  });

  it('should convert Buffer input to base64 before processing', async () => {
    const mockEvent = {
      title: 'Buffer Meeting',
      description: '',
      startDate: '2025-07-02T10:00:00Z',
      endDate: '2025-07-02T11:00:00Z',
      location: '',
      timezone: 'UTC',
      summary: 'Meeting',
      confidence: {
        title: 0.8,
        description: 0.6,
        startDate: 0.9,
        endDate: 0.8,
        location: 0.5,
        timezone: 0.4,
        overall: 0.68,
      },
      isAllDay: false,
      recurrence: null,
    };

    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify(mockEvent),
          },
        },
      ],
    };

    // @ts-expect-error – relax type for jest mock
    (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue(mockResponse);

    const bufferInput = Buffer.from([0xff, 0xd8, 0xff, 0xd9]); // minimal JPEG bytes

    const result = await aiService.parseEventImage(bufferInput);

    expect(result.title).toBe('Buffer Meeting');
    expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalledTimes(1);
  });

  it('should throw a descriptive error on invalid JSON response', async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: 'not-json',
          },
        },
      ],
    };

    // @ts-expect-error – relax type for jest mock
    (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue(mockResponse);

    await expect(aiService.parseEventImage('dummy')).rejects.toThrow(
      'Invalid response format from AI service'
    );
  });
});

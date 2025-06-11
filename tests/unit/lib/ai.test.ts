import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { ExtractedEventData, AIProcessingService, OpenAIClient } from '../../../lib/ai';

describe('AI Processing Service', () => {
  let aiService: AIProcessingService;
  let mockOpenAIClient: OpenAIClient;

  beforeEach(() => {
    // Create a mock OpenAI client
    mockOpenAIClient = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    };

    // Create service with injected mock
    aiService = new AIProcessingService(mockOpenAIClient);
  });

  describe('ExtractedEventData interface', () => {
    it('should have the correct structure for extracted event data', () => {
      const mockEventData: ExtractedEventData = {
        title: 'Team Meeting',
        description: 'Weekly team sync',
        startDate: new Date('2024-01-15T14:00:00Z'),
        endDate: new Date('2024-01-15T15:00:00Z'),
        location: 'Conference Room A',
        timezone: 'America/New_York',
        confidence: {
          title: 0.95,
          description: 0.8,
          startDate: 0.9,
          endDate: 0.85,
          location: 0.7,
          timezone: 0.6,
          overall: 0.81,
        },
        isAllDay: false,
        recurrence: null,
      };

      expect(mockEventData.title).toBe('Team Meeting');
      expect(mockEventData.confidence.overall).toBe(0.81);
    });
  });

  describe('extractEventDetails', () => {
    it('should extract event details from natural language text', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'Doctor Appointment',
                description: 'Annual checkup',
                startDate: '2024-01-15T10:00:00Z',
                endDate: '2024-01-15T11:00:00Z',
                location: 'Medical Center',
                timezone: 'America/New_York',
                confidence: {
                  title: 0.95,
                  description: 0.8,
                  startDate: 0.9,
                  endDate: 0.85,
                  location: 0.7,
                  timezone: 0.6,
                  overall: 0.81,
                },
                isAllDay: false,
                recurrence: null,
              }),
            },
          },
        ],
      };

      (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue(mockResponse);

      const result = await aiService.extractEventDetails('Doctor appointment tomorrow at 10am');

      expect(result.title).toBe('Doctor Appointment');
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.confidence.overall).toBe(0.81);
      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4',
          temperature: 0.1,
        })
      );
    });

    it('should handle timezone detection and conversion', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'Video Call',
                description: 'Client meeting',
                startDate: '2024-01-15T14:00:00Z',
                endDate: '2024-01-15T15:00:00Z',
                location: 'Virtual',
                timezone: 'America/Los_Angeles',
                confidence: {
                  title: 0.9,
                  description: 0.8,
                  startDate: 0.95,
                  endDate: 0.9,
                  location: 0.6,
                  timezone: 0.8,
                  overall: 0.84,
                },
                isAllDay: false,
                recurrence: null,
              }),
            },
          },
        ],
      };

      (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue(mockResponse);

      const result = await aiService.extractEventDetails(
        'Video call with client at 2pm PST tomorrow',
        { timezone: 'America/Los_Angeles' }
      );

      expect(result.timezone).toBe('America/Los_Angeles');
      expect(result.confidence.timezone).toBe(0.8);
    });

    it('should handle API failures gracefully', async () => {
      (mockOpenAIClient.chat.completions.create as jest.Mock).mockRejectedValue(
        new Error('API Error')
      );

      await expect(aiService.extractEventDetails('Meeting tomorrow')).rejects.toThrow(
        'AI processing failed: API Error'
      );
    });

    it('should handle invalid JSON responses', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Invalid JSON response',
            },
          },
        ],
      };

      (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue(mockResponse);

      await expect(aiService.extractEventDetails('Meeting tomorrow')).rejects.toThrow(
        'AI processing failed: Invalid response format from AI service'
      );
    });

    it('should sanitize input text', async () => {
      const maliciousInput = '<script>alert("xss")</script>Meeting tomorrow';
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'Meeting',
                description: '',
                startDate: '2024-01-15T10:00:00Z',
                endDate: '2024-01-15T11:00:00Z',
                location: '',
                timezone: 'UTC',
                confidence: {
                  title: 0.8,
                  description: 0.5,
                  startDate: 0.7,
                  endDate: 0.7,
                  location: 0.3,
                  timezone: 0.5,
                  overall: 0.6,
                },
                isAllDay: false,
                recurrence: null,
              }),
            },
          },
        ],
      };

      (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue(mockResponse);

      const result = await aiService.extractEventDetails(maliciousInput);

      expect(result).toBeDefined();
      expect(result.title).toBe('Meeting');
    });

    it('should retry on rate limit errors with exponential backoff', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).status = 429;

      (mockOpenAIClient.chat.completions.create as jest.Mock)
        .mockRejectedValueOnce(rateLimitError)
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  title: 'Retry Test Meeting',
                  description: '',
                  startDate: '2024-01-15T10:00:00Z',
                  endDate: '2024-01-15T11:00:00Z',
                  location: '',
                  timezone: 'UTC',
                  confidence: {
                    title: 0.9,
                    description: 0.5,
                    startDate: 0.8,
                    endDate: 0.8,
                    location: 0.3,
                    timezone: 0.5,
                    overall: 0.68,
                  },
                  isAllDay: false,
                  recurrence: null,
                }),
              },
            },
          ],
        });

      const result = await aiService.extractEventDetails('Meeting tomorrow');

      expect(result.title).toBe('Retry Test Meeting');
      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalledTimes(3);
    });
  });

  describe('error handling', () => {
    it('should throw error when OpenAI API key is missing and no client provided', () => {
      const originalEnv = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      expect(() => new AIProcessingService()).toThrow(
        'OPENAI_API_KEY environment variable is required'
      );

      // Restore
      if (originalEnv) {
        process.env.OPENAI_API_KEY = originalEnv;
      }
    });

    it('should validate extracted data dates', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'Bad Date Meeting',
                description: '',
                startDate: '2024-01-15T15:00:00Z', // End before start
                endDate: '2024-01-15T10:00:00Z',
                location: '',
                timezone: 'UTC',
                confidence: {
                  title: 0.9,
                  description: 0.5,
                  startDate: 0.8,
                  endDate: 0.8,
                  location: 0.3,
                  timezone: 0.5,
                  overall: 0.68,
                },
                isAllDay: false,
                recurrence: null,
              }),
            },
          },
        ],
      };

      (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue(mockResponse);

      await expect(aiService.extractEventDetails('Meeting tomorrow')).rejects.toThrow(
        'AI processing failed: End date must be after start date'
      );
    });

    it('should validate confidence scores', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'Bad Confidence Meeting',
                description: '',
                startDate: '2024-01-15T10:00:00Z',
                endDate: '2024-01-15T11:00:00Z',
                location: '',
                timezone: 'UTC',
                confidence: {
                  title: 1.5, // Invalid confidence score
                  description: 0.5,
                  startDate: 0.8,
                  endDate: 0.8,
                  location: 0.3,
                  timezone: 0.5,
                  overall: 0.68,
                },
                isAllDay: false,
                recurrence: null,
              }),
            },
          },
        ],
      };

      (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue(mockResponse);

      await expect(aiService.extractEventDetails('Meeting tomorrow')).rejects.toThrow(
        'AI processing failed: Invalid confidence score for title'
      );
    });
  });
});

/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/ai/parse-events/route';
import { AIProcessingService } from '@/lib/ai';

// Mock the AI service
jest.mock('@/lib/ai', () => ({
  AIProcessingService: jest.fn(),
}));

const MockedAIProcessingService = AIProcessingService as jest.MockedClass<
  typeof AIProcessingService
>;

describe('/api/ai/parse-events', () => {
  let mockExtractEventDetails: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockExtractEventDetails = jest.fn();
    MockedAIProcessingService.mockImplementation(
      () =>
        ({
          extractEventDetails: mockExtractEventDetails,
        }) as any
    );
  });

  const createMockRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/ai/parse-events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  };

  describe('successful requests', () => {
    it('should process valid text input and return structured event data', async () => {
      const mockEventData = {
        id: '1',
        title: 'Team Meeting',
        description: 'Weekly team sync',
        startDate: new Date('2025-06-12T14:00:00Z'),
        endDate: new Date('2025-06-12T15:00:00Z'),
        location: 'Conference Room A',
        timezone: 'America/New_York',
        confidence: {
          title: 0.95,
          description: 0.8,
          startDate: 0.9,
          endDate: 0.9,
          location: 0.85,
          timezone: 0.9,
          overall: 0.88,
        },
        isAllDay: false,
        recurrence: null,
      };

      mockExtractEventDetails.mockResolvedValue(mockEventData);

      const request = createMockRequest({
        text: 'Team meeting tomorrow at 2pm in Conference Room A',
        options: {
          timezone: 'America/New_York',
          currentDate: '2025-06-11T17:00:00Z',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.event).toEqual({
        id: '1',
        title: 'Team Meeting',
        description: 'Weekly team sync',
        startDate: '2025-06-12T14:00:00.000Z',
        endDate: '2025-06-12T15:00:00.000Z',
        location: 'Conference Room A',
        timezone: 'America/New_York',
        confidence: {
          title: 0.95,
          description: 0.8,
          startDate: 0.9,
          endDate: 0.9,
          location: 0.85,
          timezone: 0.9,
          overall: 0.88,
        },
        isAllDay: false,
        recurrence: null,
      });
      expect(data.processingTimeMs).toBeGreaterThanOrEqual(0);

      expect(mockExtractEventDetails).toHaveBeenCalledWith(
        'Team meeting tomorrow at 2pm in Conference Room A',
        {
          timezone: 'America/New_York',
          currentDate: new Date('2025-06-11T17:00:00Z'),
          userPreferences: undefined,
        }
      );
    });

    it('should handle requests with user preferences', async () => {
      const mockEventData = {
        id: '1',
        title: 'Meeting',
        description: '',
        startDate: new Date('2025-06-12T14:00:00Z'),
        endDate: new Date('2025-06-12T15:30:00Z'), // 90 minutes (custom duration)
        location: '',
        timezone: 'America/New_York',
        confidence: {
          title: 0.9,
          description: 0.5,
          startDate: 0.9,
          endDate: 0.9,
          location: 0.5,
          timezone: 0.9,
          overall: 0.78,
        },
        isAllDay: false,
        recurrence: null,
      };

      mockExtractEventDetails.mockResolvedValue(mockEventData);

      const request = createMockRequest({
        text: 'Meeting at 2pm',
        options: {
          timezone: 'America/New_York',
          currentDate: '2025-06-11T17:00:00Z',
          userPreferences: {
            defaultDuration: 90,
          },
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockExtractEventDetails).toHaveBeenCalledWith('Meeting at 2pm', {
        timezone: 'America/New_York',
        currentDate: new Date('2025-06-11T17:00:00Z'),
        userPreferences: {
          defaultDuration: 90,
        },
      });
    });

    it('should use default values when options are not provided', async () => {
      const mockEventData = {
        id: '1',
        title: 'Meeting',
        description: '',
        startDate: new Date('2025-06-12T14:00:00Z'),
        endDate: new Date('2025-06-12T15:00:00Z'),
        location: '',
        timezone: 'UTC',
        confidence: {
          title: 0.9,
          description: 0.5,
          startDate: 0.9,
          endDate: 0.9,
          location: 0.5,
          timezone: 0.9,
          overall: 0.78,
        },
        isAllDay: false,
        recurrence: null,
      };

      mockExtractEventDetails.mockResolvedValue(mockEventData);

      const request = createMockRequest({
        text: 'Meeting at 2pm',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockExtractEventDetails).toHaveBeenCalledWith('Meeting at 2pm', {
        timezone: 'UTC',
        currentDate: expect.any(Date),
        userPreferences: undefined,
      });
    });
  });

  describe('error handling', () => {
    it('should return 400 for missing text', async () => {
      const request = createMockRequest({
        options: { timezone: 'America/New_York' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Text input is required');
      expect(mockExtractEventDetails).not.toHaveBeenCalled();
    });

    it('should return 400 for empty text', async () => {
      const request = createMockRequest({
        text: '   ',
        options: { timezone: 'America/New_York' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Text input is required');
      expect(mockExtractEventDetails).not.toHaveBeenCalled();
    });

    it('should return 400 for non-string text', async () => {
      const request = createMockRequest({
        text: 123,
        options: { timezone: 'America/New_York' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Text input is required');
      expect(mockExtractEventDetails).not.toHaveBeenCalled();
    });

    it('should return 500 when AI service throws an error', async () => {
      mockExtractEventDetails.mockRejectedValue(new Error('OpenAI API failed'));

      const request = createMockRequest({
        text: 'Meeting tomorrow at 2pm',
        options: { timezone: 'America/New_York' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to process text. Please try again.');
      expect(mockExtractEventDetails).toHaveBeenCalled();
    });

    it('should return 500 when AI service throws a non-Error object', async () => {
      mockExtractEventDetails.mockRejectedValue('String error');

      const request = createMockRequest({
        text: 'Meeting tomorrow at 2pm',
        options: { timezone: 'America/New_York' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to process text. Please try again.');
    });

    it('should handle malformed JSON gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/parse-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{ invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to process text. Please try again.');
    });
  });

  describe('response format', () => {
    it('should return correctly formatted response with processing time', async () => {
      const mockEventData = {
        id: '1',
        title: 'Meeting',
        description: '',
        startDate: new Date('2025-06-12T14:00:00Z'),
        endDate: new Date('2025-06-12T15:00:00Z'),
        location: '',
        timezone: 'America/New_York',
        confidence: {
          title: 0.9,
          description: 0.5,
          startDate: 0.9,
          endDate: 0.9,
          location: 0.5,
          timezone: 0.9,
          overall: 0.78,
        },
        isAllDay: false,
        recurrence: null,
      };

      mockExtractEventDetails.mockResolvedValue(mockEventData);

      const request = createMockRequest({
        text: 'Meeting at 2pm',
        options: { timezone: 'America/New_York' },
      });

      const startTime = Date.now();
      const response = await POST(request);
      const endTime = Date.now();
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.event.id).toBe('1');
      expect(data.event.startDate).toBe('2025-06-12T14:00:00.000Z');
      expect(data.event.endDate).toBe('2025-06-12T15:00:00.000Z');
      expect(data.processingTimeMs).toBeGreaterThanOrEqual(0);
      expect(data.processingTimeMs).toBeLessThanOrEqual(endTime - startTime);
    });
  });
});

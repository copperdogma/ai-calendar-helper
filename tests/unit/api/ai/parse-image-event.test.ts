/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/ai/parse-image-event/route';
import { AIProcessingService } from '@/lib/ai';

// Mock AIProcessingService
jest.mock('@/lib/ai', () => ({
  AIProcessingService: jest.fn(),
}));

const MockedAIProcessingService = AIProcessingService as jest.MockedClass<
  typeof AIProcessingService
>;

describe('/api/ai/parse-image-event', () => {
  let mockParseEventImage: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockParseEventImage = jest.fn();
    MockedAIProcessingService.mockImplementation(
      () => ({ parseEventImage: mockParseEventImage }) as any
    );
  });

  const createMockRequest = (formData: FormData) => {
    const req = new NextRequest('http://localhost/api/ai/parse-image-event', {
      method: 'POST',
      body: formData as any,
    });
    // Override formData method to return our object (NextRequest clones body)
    // @ts-ignore
    req.formData = async () => formData;
    return req;
  };

  const createTestImage = () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]); // minimal jpeg
    const blob = new Blob([bytes], { type: 'image/jpeg' });
    return blob;
  };

  it('should process a valid image and return structured event data', async () => {
    const blob = createTestImage();
    const form = new FormData();
    form.append('image', blob, 'test.jpg');

    const mockEvent = {
      title: 'Flyer Event',
      description: '',
      startDate: '2025-08-01T09:00:00Z',
      endDate: '2025-08-01T10:00:00Z',
      location: 'Hall A',
      timezone: 'UTC',
      summary: 'Flyer',
      confidence: { overall: 0.8 },
    };

    mockParseEventImage.mockResolvedValue(mockEvent);

    const request = createMockRequest(form);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.events).toHaveLength(1);
    expect(data.events[0].title).toBe('Flyer Event');
    expect(mockParseEventImage).toHaveBeenCalledTimes(1);
  });

  it('should return 400 if image is missing', async () => {
    const form = new FormData();
    const request = createMockRequest(form);

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});

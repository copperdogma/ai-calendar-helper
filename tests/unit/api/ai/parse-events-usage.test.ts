/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/ai/parse-events/route';
import { AIProcessingService } from '@/lib/ai';
import { getToken } from 'next-auth/jwt';
import { incrementUsage } from '@/lib/services/usage.service';

// -----------------------------
// Jest Mocks
// -----------------------------

jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

jest.mock('@/lib/services/usage.service', () => ({
  incrementUsage: jest.fn(),
}));

jest.mock('@/lib/ai', () => ({
  AIProcessingService: jest.fn(),
}));

const MockedAIProcessingService = AIProcessingService as jest.MockedClass<
  typeof AIProcessingService
>;

const mockedGetToken = getToken as jest.Mock;
const mockedIncrementUsage = incrementUsage as jest.Mock;

// -----------------------------
// Helpers
// -----------------------------

function createMockRequest(url: string, body: Record<string, unknown>, accepts?: string) {
  return new NextRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accepts ? { Accept: accepts } : {}),
    },
    body: JSON.stringify(body),
  });
}

// -----------------------------
// Tests
// -----------------------------

describe('/api/ai/parse-events - usage tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock AIProcessingService minimal implementation
    MockedAIProcessingService.mockImplementation(
      () =>
        ({
          // Non-streaming path uses these two
          segmentText: jest.fn().mockResolvedValue([]),
          extractEvents: jest.fn().mockResolvedValue([]),
          // Streaming path needs segmentText only (empty) so loop skips parse
        }) as any
    );

    // Default getToken resolves with a user id
    mockedGetToken.mockResolvedValue({ sub: 'test-user-id' });
  });

  it('should call incrementUsage for non-streaming requests when user is authenticated', async () => {
    const request = createMockRequest('http://localhost/api/ai/parse-events', {
      text: 'Test event tomorrow',
    });

    await POST(request);

    expect(mockedIncrementUsage).toHaveBeenCalledTimes(1);
    expect(mockedIncrementUsage).toHaveBeenCalledWith({
      userId: 'test-user-id',
      // @ts-ignore string literal enum
      service: 'CALENDAR_PARSER',
    });
  });

  it('should call incrementUsage for streaming requests when user is authenticated', async () => {
    const request = createMockRequest(
      'http://localhost/api/ai/parse-events?stream=true',
      {
        text: 'Test event tomorrow',
      },
      'text/event-stream'
    );

    await POST(request);

    expect(mockedIncrementUsage).toHaveBeenCalledTimes(1);
    expect(mockedIncrementUsage).toHaveBeenCalledWith({
      userId: 'test-user-id',
      // @ts-ignore string literal enum
      service: 'CALENDAR_PARSER',
    });
  });

  it('should NOT call incrementUsage when getToken returns null (unauthenticated)', async () => {
    mockedGetToken.mockResolvedValueOnce(null);

    const request = createMockRequest('http://localhost/api/ai/parse-events', {
      text: 'Unauthenticated request',
    });

    await POST(request);

    expect(mockedIncrementUsage).not.toHaveBeenCalled();
  });
});

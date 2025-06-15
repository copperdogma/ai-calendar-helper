import { ApiError } from '@/lib/errors/ApiError';
import { handleApiError } from '@/lib/errors/handleApiError';

// Mock Sentry to avoid network calls during tests
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
}));

describe('ApiError', () => {
  it('should create an instance with provided statusCode, message, and code', () => {
    const err = new ApiError(404, 'Not found', 'NOT_FOUND');

    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Not found');
    expect(err.code).toBe('NOT_FOUND');
  });
});

describe('handleApiError', () => {
  it('should convert an ApiError into a standardized NextResponse', async () => {
    const err = new ApiError(400, 'Validation failed', 'VALIDATION_ERROR');
    const res = handleApiError(err);

    // NextResponse is not a traditional class constructor under test env, so focus on shape
    expect(res).toHaveProperty('status', 400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(json.error.message).toBe('Validation failed');
  });

  it('should wrap a generic Error into an ApiError with status 500', async () => {
    const res = handleApiError(new Error('Something bad'));

    const json = await res.json();
    expect(res.status).toBe(500);
    expect(json.error.code).toBe('INTERNAL_ERROR');
    expect(json.error.message).toBe('Something bad');
  });

  it('should wrap non-Error values into an ApiError with status 500', async () => {
    const res = handleApiError('string error' as unknown as Error);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error.message).toBe('string error');
  });
});

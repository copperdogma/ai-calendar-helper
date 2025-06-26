/**
 * @jest-environment node
 */

import {
  getRequestId,
  getRequestPath,
  getRequestMethod,
  sanitizeHeaders,
  createErrorResponse,
} from '@/lib/services/api-logger-service';

// Mock Request / NextRequest minimal stand-ins
const mockRequest = new Request('https://example.com/api/test?foo=bar', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer abc',
    'Content-Type': 'application/json',
  },
});

describe('api-logger-service helpers', () => {
  it('getRequestId returns non-empty string', () => {
    const id1 = getRequestId();
    const id2 = getRequestId(mockRequest);
    expect(id1.length).toBeGreaterThan(8);
    expect(id2.length).toBeGreaterThan(8);
  });

  it('getRequestPath extracts pathname', () => {
    const path = getRequestPath(mockRequest);
    expect(path).toBe('/api/test');
  });

  it('getRequestMethod returns the HTTP method', () => {
    const method = getRequestMethod(mockRequest);
    expect(method).toBe('POST');
  });

  it('sanitizeHeaders redacts sensitive values', () => {
    const sanitized = sanitizeHeaders(mockRequest.headers);
    expect(sanitized.authorization).toBe('[REDACTED]');
    expect(sanitized['content-type']).toBe('application/json');
  });

  it('createErrorResponse returns a NextResponse with status', () => {
    const res = createErrorResponse(new Error('boom'), 'abc123', 418);
    expect(typeof (res as any).status).toBe('number');
    expect(res.status).toBe(418);
  });
});

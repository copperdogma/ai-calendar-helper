/**
 * @jest-environment node
 */

import { AIProcessingService } from '@/lib/ai';

describe('AIProcessingService private helpers', () => {
  const svc = new AIProcessingService();

  it('sanitizeInput removes script tags and javascript: URIs', () => {
    const dirty = "<script>alert('x')</script> hello javascript:foo";
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const clean: string = (svc as any).sanitizeInput(dirty);
    expect(clean).toBe('hello foo');
  });

  it('isRetryableError recognises 429 & 5xx', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const is429 = (svc as any).isRetryableError({ status: 429 });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const is500 = (svc as any).isRetryableError({ status: 502 });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const is400 = (svc as any).isRetryableError({ status: 400 });
    expect(is429).toBe(true);
    expect(is500).toBe(true);
    expect(is400).toBe(false);
  });
});

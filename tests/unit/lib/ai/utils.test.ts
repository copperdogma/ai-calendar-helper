/**
 * @jest-environment node
 */

import { AIProcessingService } from '@/lib/ai';

describe('AIProcessingService private helpers', () => {
  const svc = new AIProcessingService();

  it('sanitizeInput removes script tags and javascript: URIs', () => {
    const dirty = "<script>alert('x')</script> hello javascript:foo";

    const clean: string = (svc as any).sanitizeInput(dirty);
    expect(clean).toBe('hello foo');
  });

  it('isRetryableError recognises 429 & 5xx', () => {
    const is429 = (svc as any).isRetryableError({ status: 429 });

    const is500 = (svc as any).isRetryableError({ status: 502 });

    const is400 = (svc as any).isRetryableError({ status: 400 });
    expect(is429).toBe(true);
    expect(is500).toBe(true);
    expect(is400).toBe(false);
  });
});

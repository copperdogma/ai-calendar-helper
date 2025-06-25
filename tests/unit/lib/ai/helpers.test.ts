/**
 * @jest-environment node
 */

import { AIProcessingService, AIModel } from '@/lib/ai';

describe('AIProcessingService helper functions (private)', () => {
  const svc = new AIProcessingService(undefined, AIModel.GPT_4O_MINI);

  it('estimateCost returns sensible positive number', () => {
    // 1K input, 2K output tokens at pricing table should be >0 and <1 USD
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const cost: number = (svc as any).estimateCost(1000, 2000, AIModel.GPT_4O_MINI);
    expect(cost).toBeGreaterThan(0);
    expect(cost).toBeLessThan(1);
  });

  it('buildSystemPrompt includes timezone and multi-event rules', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const prompt: string = (svc as any).buildSystemPrompt({ timezone: 'America/Denver', multiEvent: true });
    expect(prompt).toContain('America/Denver');
    expect(prompt).toContain('"events" array');
  });

  it('sleep resolves after given milliseconds', async () => {
    jest.useFakeTimers();
    const spy = jest.fn();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    (svc as any).sleep(50).then(spy);
    jest.advanceTimersByTime(49);
    expect(spy).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    await Promise.resolve(); // allow microtask queue to flush
    expect(spy).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('parseResponse returns JS object for valid JSON', () => {
    const json = JSON.stringify({
      title: 'Test',
      description: 'Demo',
      startDate: '2025-01-01T00:00:00Z',
      endDate: '2025-01-01T01:00:00Z',
      confidence: { overall: 0.9, title: 0.9, description: 0.9, startDate: 0.9, endDate: 0.9, location: 0.9, timezone: 0.9 },
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const obj = (svc as any).parseResponse(json);
    expect(obj).toEqual(expect.objectContaining({ title: 'Test' }));
  });

  it('parseResponse throws on malformed JSON', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    expect(() => (svc as any).parseResponse('{ invalid json')).toThrow('Invalid response format');
  });
}); 
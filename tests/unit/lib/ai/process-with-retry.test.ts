/**
 * @jest-environment node
 */

import { AIProcessingService, AIModel } from '@/lib/ai';

// Mock the OpenAI Responses helper
jest.mock('@/lib/openaiResponse', () => ({
  createResponse: jest.fn(),
}));

const { createResponse } = jest.requireMock('@/lib/openaiResponse');

describe('AIProcessingService.processWithRetry / isRetryableError', () => {
  const svc = new AIProcessingService(undefined, AIModel.GPT_4O_MINI);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retries once on 429 and then succeeds', async () => {
    // Arrange: first call rejects with 429, second call succeeds
    (createResponse as jest.Mock)
      .mockRejectedValueOnce({ status: 429 })
      .mockResolvedValueOnce({ output_text: '{"ok":true}' });

    // Speed-up: make sleep instant
    jest.spyOn<any, any>(svc as any, 'sleep').mockImplementation(() => Promise.resolve());

    const result = await (svc as any).processWithRetry('SYS', 'hello', AIModel.GPT_4O_MINI);

    expect(result).toBe('{"ok":true}');
    expect(createResponse).toHaveBeenCalledTimes(2);
  });

  it('stops retrying after max attempts for non-retryable error', async () => {
    (createResponse as jest.Mock).mockRejectedValue({ status: 400 });
    jest.spyOn<any, any>(svc as any, 'sleep').mockImplementation(() => Promise.resolve());

    await expect(
      (svc as any).processWithRetry('SYS', 'data', AIModel.GPT_4O_MINI)
    ).rejects.toBeDefined();
    expect(createResponse).toHaveBeenCalledTimes(1);
  });

  it('isRetryableError returns false when status is undefined', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const res: boolean = (svc as any).isRetryableError({});
    expect(res).toBe(false);
  });
});

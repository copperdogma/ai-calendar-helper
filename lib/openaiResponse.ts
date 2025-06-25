import OpenAI, { type ClientOptions } from 'openai';

/**
 * Singleton OpenAI client instance so that HTTP/2 connections are reused across
 * the application. Falls back to environment variables for configuration.
 */
class OpenAIClientSingleton {
  private static instance: OpenAI | null = null;

  /**
   * Get or create the shared OpenAI client. Accepts optional overrides (useful
   * for tests).
   */
  static getClient(opts?: ClientOptions): OpenAI {
    if (this.instance && !opts) return this.instance;

    const apiKey = opts?.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.instance = new OpenAI({ apiKey, ...opts });
    return this.instance;
  }
}

export type CreateResponseParams = Parameters<OpenAI["responses"]["create"]>[0];

interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
}

/**
 * Wrapper around `client.responses.create` with basic exponential backoff for
 * retryable errors (HTTP 429, 5xx).
 */
export async function createResponse<T = unknown>(
  params: CreateResponseParams,
  retry: RetryOptions = {}
): Promise<T> {
  const client = OpenAIClientSingleton.getClient();

  const maxRetries = retry.maxRetries ?? 3;
  const baseDelay = retry.baseDelayMs ?? 1000;

  let lastErr: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore – beta types may not ship with SDK yet
      const resp = await client.responses.create(params);
      return resp as unknown as T;
    } catch (err: any) {
      lastErr = err;
      const status = err?.status ?? err?.statusCode;
      const isRetryable = status === 429 || (status >= 500 && status < 600);
      if (!isRetryable || attempt === maxRetries - 1) {
        throw lastErr;
      }
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  // should never get here
  throw lastErr as Error;
}

/**
 * TEST-ONLY: Reset the internal singleton instance. This helper is not meant
 * for production usage but allows Jest tests to ensure isolation when
 * mocking the OpenAI SDK implementation.
 */
export function __resetOpenAIClientSingletonForTests() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore – accessing private property for test purposes.
  OpenAIClientSingleton.instance = null;
} 
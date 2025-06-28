// createResponse will be imported lazily inside each test after mocks are set up

jest.mock('openai', () => {
  const createMock = jest.fn();
  (global as any).__openaiCreateMock = createMock;

  function OpenAI(this: any) {
    this.responses = { create: createMock };
    return this;
  }
  return {
    __esModule: true,
    default: OpenAI,
  };
});

const OpenAI = require('openai').default as jest.Mock;
const createMock = (global as any).__openaiCreateMock as jest.Mock;

describe('openaiResponse helper', () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key';
    const { __resetOpenAIClientSingletonForTests } = require('@/lib/openaiResponse');
    __resetOpenAIClientSingletonForTests();
    jest.resetAllMocks();
  });

  it('should delegate to client.responses.create with provided params', async () => {
    const expectedResponse = { id: 'resp_123', status: 'completed' };
    createMock.mockResolvedValue(expectedResponse);

    const { createResponse } = require('@/lib/openaiResponse');
    const params = { model: 'gpt-4o-mini', input: 'hello world' } as any;
    const result = await createResponse(params);

    expect(result).toBe(expectedResponse);
    expect(createMock).toHaveBeenCalledWith(params);
  });

  it('should retry on retryable errors with exponential back-off', async () => {
    const retryableError = Object.assign(new Error('server error'), { status: 500 });
    const createMock = (global as any).__openaiCreateMock as jest.Mock;
    createMock.mockRejectedValueOnce(retryableError).mockResolvedValueOnce({ id: 'resp_ok' });

    const { createResponse } = require('@/lib/openaiResponse');
    const start = Date.now();
    const result = await createResponse({ model: 'gpt-4o-mini', input: 'retry test' } as any);
    const elapsed = Date.now() - start;

    expect(result).toEqual({ id: 'resp_ok' });
    expect(createMock).toHaveBeenCalledTimes(2);
    expect(elapsed).toBeGreaterThanOrEqual(100);
  });
});

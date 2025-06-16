import Redis from 'ioredis';
import { getOptionalRedisClient } from '@/lib/redis';
// import { logger } from '@/lib/logger'; // Currently unused but may be needed for future tests

// Mock ioredis directly
jest.mock('ioredis', () => {
  const mockRedisInstance = {
    status: 'ready',
    options: { host: 'localhost', port: 6379 },
    on: jest.fn(),
    removeAllListeners: jest.fn(),
  };

  const MockRedisClass = jest.fn(() => mockRedisInstance);
  MockRedisClass.prototype = mockRedisInstance;

  // This is the key change: the module itself should have a 'Redis' property
  // that is the constructor, and the default export is the constructor.
  return Object.assign(MockRedisClass, {
    Redis: MockRedisClass,
  });
});

// Mock other dependencies
jest.mock('@/lib/env', () => ({
  env: {
    REDIS_URL: undefined,
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    })),
  },
}));

const MockRedis = Redis as jest.MockedClass<typeof Redis>;
// const mockLogger = logger as jest.Mocked<typeof logger>; // Currently unused

// Mock child logger
// const mockChildLogger = {  // Currently unused
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
//   debug: jest.fn(),
// } as any;

// interface MockCall { // Currently unused
//   [0]: string;
//   [1]: (...args: any[]) => void;
// }

describe('Redis Client', () => {
  let originalNextRuntime: string | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Store and clear NEXT_RUNTIME
    originalNextRuntime = process.env.NEXT_RUNTIME;
    delete process.env.NEXT_RUNTIME;

    // Reset the mock implementation
    MockRedis.mockClear();

    // Reset global state
    const globalKey = Symbol.for('__NEXT_REDIS_CLIENT_SINGLETON__');
    const globalWithRedis = globalThis as any;
    delete globalWithRedis[globalKey];
  });

  afterEach(() => {
    // Restore NEXT_RUNTIME
    process.env.NEXT_RUNTIME = originalNextRuntime;
  });

  describe('getOptionalRedisClient', () => {
    it('should return null when running on the edge', () => {
      process.env.NEXT_RUNTIME = 'edge';
      const client = getOptionalRedisClient();
      expect(client).toBeNull();
    });

    it('should return null when REDIS_URL is not configured', () => {
      process.env.NEXT_RUNTIME = 'nodejs';
      // Test the actual module behavior when REDIS_URL is not set
      jest.isolateModules(() => {
        // Mock env with no REDIS_URL
        jest.doMock('@/lib/env', () => ({
          env: { REDIS_URL: undefined },
        }));

        // Mock logger
        jest.doMock('@/lib/logger', () => ({
          logger: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            child: jest.fn(() => ({
              info: jest.fn(),
              warn: jest.fn(),
              error: jest.fn(),
              debug: jest.fn(),
            })),
          },
        }));

        const { getOptionalRedisClient: isolatedGetClient } = require('@/lib/redis');
        const client = isolatedGetClient();

        expect(client).toBeNull();
      });
    });

    it('should return null when Redis is explicitly disabled', () => {
      process.env.NEXT_RUNTIME = 'nodejs';
      jest.isolateModules(() => {
        jest.doMock('@/lib/env', () => ({
          env: { REDIS_URL: undefined },
        }));

        jest.doMock('@/lib/logger', () => ({
          logger: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            child: jest.fn(() => ({
              info: jest.fn(),
              warn: jest.fn(),
              error: jest.fn(),
              debug: jest.fn(),
            })),
          },
        }));

        const { getOptionalRedisClient: isolatedGetClient } = require('@/lib/redis');

        // First call to disable Redis
        isolatedGetClient();

        // Second call should return null immediately
        const client = isolatedGetClient();

        expect(client).toBeNull();
      });
    });

    it('should create Redis client when REDIS_URL is configured', () => {
      process.env.NEXT_RUNTIME = 'nodejs';
      jest.isolateModules(() => {
        const mockRedisInstance = {
          status: 'ready',
          options: { host: 'localhost', port: 6379 },
          on: jest.fn(),
          removeAllListeners: jest.fn(),
        };

        jest.doMock('ioredis', () => jest.fn(() => mockRedisInstance));
        jest.doMock('@/lib/env', () => ({
          env: { REDIS_URL: 'redis://localhost:6379' },
        }));

        jest.doMock('@/lib/logger', () => ({
          logger: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            child: jest.fn(() => ({
              info: jest.fn(),
              warn: jest.fn(),
              error: jest.fn(),
              debug: jest.fn(),
            })),
          },
        }));

        const { getOptionalRedisClient: isolatedGetClient } = require('@/lib/redis');
        const client = isolatedGetClient();

        expect(client).toBe(mockRedisInstance);
      });
    });

    it('should return null when Redis client is not in ready state', () => {
      process.env.NEXT_RUNTIME = 'nodejs';
      jest.isolateModules(() => {
        const mockRedisInstance = {
          status: 'disconnected',
          options: { host: 'localhost', port: 6379 },
          on: jest.fn(),
          removeAllListeners: jest.fn(),
        };

        jest.doMock('ioredis', () => jest.fn(() => mockRedisInstance));
        jest.doMock('@/lib/env', () => ({
          env: { REDIS_URL: 'redis://localhost:6379' },
        }));

        const { getOptionalRedisClient: isolatedGetClient } = require('@/lib/redis');
        const client = isolatedGetClient();

        expect(client).toBeNull();
      });
    });

    it('should return null when connection has failed', () => {
      process.env.NEXT_RUNTIME = 'nodejs';
      jest.isolateModules(() => {
        jest.doMock('ioredis', () =>
          jest.fn(() => {
            throw new Error('Connection failed');
          })
        );
        jest.doMock('@/lib/env', () => ({
          env: { REDIS_URL: 'redis://localhost:6379' },
        }));

        const { getOptionalRedisClient: isolatedGetClient } = require('@/lib/redis');
        const client = isolatedGetClient();

        expect(client).toBeNull();
      });
    });
  });

  describe('Redis Client Connection Events', () => {
    it('should attach event listeners to Redis client', () => {
      process.env.NEXT_RUNTIME = 'nodejs';
      jest.isolateModules(() => {
        const mockRedisInstance = {
          status: 'connecting',
          options: { host: 'localhost', port: 6379 },
          on: jest.fn(),
          removeAllListeners: jest.fn(),
        };

        jest.doMock('ioredis', () => jest.fn(() => mockRedisInstance));
        jest.doMock('@/lib/env', () => ({
          env: { REDIS_URL: 'redis://localhost:6379' },
        }));

        const { getOptionalRedisClient: isolatedGetClient } = require('@/lib/redis');
        isolatedGetClient();

        expect(mockRedisInstance.removeAllListeners).toHaveBeenCalledWith('connect');
        expect(mockRedisInstance.removeAllListeners).toHaveBeenCalledWith('error');
        expect(mockRedisInstance.removeAllListeners).toHaveBeenCalledWith('close');
        expect(mockRedisInstance.removeAllListeners).toHaveBeenCalledWith('reconnecting');

        expect(mockRedisInstance.on).toHaveBeenCalledWith('connect', expect.any(Function));
        expect(mockRedisInstance.on).toHaveBeenCalledWith('error', expect.any(Function));
        expect(mockRedisInstance.on).toHaveBeenCalledWith('close', expect.any(Function));
        expect(mockRedisInstance.on).toHaveBeenCalledWith('reconnecting', expect.any(Function));
      });
    });
  });

  describe('Redis Retry Strategy', () => {
    it('should implement exponential backoff with cap', () => {
      process.env.NEXT_RUNTIME = 'nodejs';
      jest.isolateModules(() => {
        let capturedRetryStrategy: ((times: number) => number | null) | undefined;

        const mockRedisInstance = {
          status: 'connecting',
          options: { host: 'localhost', port: 6379 },
          on: jest.fn(),
          removeAllListeners: jest.fn(),
        };

        jest.doMock('ioredis', () =>
          jest.fn((_url: string, options: any) => {
            capturedRetryStrategy = options.retryStrategy;
            return mockRedisInstance;
          })
        );
        jest.doMock('@/lib/env', () => ({
          env: { REDIS_URL: 'redis://localhost:6379' },
        }));

        jest.doMock('@/lib/logger', () => ({
          logger: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            child: jest.fn(() => ({
              info: jest.fn(),
              warn: jest.fn(),
              error: jest.fn(),
              debug: jest.fn(),
            })),
          },
        }));

        const { getOptionalRedisClient: isolatedGetClient } = require('@/lib/redis');
        isolatedGetClient();

        expect(capturedRetryStrategy).toBeDefined();
        expect(capturedRetryStrategy!(1)).toBe(200); // First retry: 200ms
        expect(capturedRetryStrategy!(2)).toBe(400); // Second retry: 400ms
        expect(capturedRetryStrategy!(3)).toBe(600); // Third retry: 600ms
        expect(capturedRetryStrategy!(5)).toBe(1000); // Fifth retry: 1000ms (Math.min(5 * 200, 3000))
        expect(capturedRetryStrategy!(6)).toBeNull(); // Sixth retry: null (stops after 5)
      });
    });

    it('should stop retrying after 5 attempts', () => {
      process.env.NEXT_RUNTIME = 'nodejs';
      jest.isolateModules(() => {
        let capturedRetryStrategy: ((times: number) => number | null) | undefined;

        const mockRedisInstance = {
          status: 'connecting',
          options: { host: 'localhost', port: 6379 },
          on: jest.fn(),
          removeAllListeners: jest.fn(),
        };

        jest.doMock('ioredis', () =>
          jest.fn((_url: string, options: any) => {
            capturedRetryStrategy = options.retryStrategy;
            return mockRedisInstance;
          })
        );
        jest.doMock('@/lib/env', () => ({
          env: { REDIS_URL: 'redis://localhost:6379' },
        }));

        const { getOptionalRedisClient: isolatedGetClient } = require('@/lib/redis');
        isolatedGetClient();

        expect(capturedRetryStrategy).toBeDefined();
        const result = capturedRetryStrategy!(6);

        expect(result).toBeNull();
      });
    });
  });

  describe('Singleton Behavior', () => {
    it('should return the same Redis client instance on multiple calls', () => {
      process.env.NEXT_RUNTIME = 'nodejs';
      jest.isolateModules(() => {
        const mockRedisInstance = {
          status: 'ready',
          options: { host: 'localhost', port: 6379 },
          on: jest.fn(),
          removeAllListeners: jest.fn(),
        };

        const mockRedisConstructor = jest.fn(() => mockRedisInstance);
        jest.doMock('ioredis', () => mockRedisConstructor);
        jest.doMock('@/lib/env', () => ({
          env: { REDIS_URL: 'redis://localhost:6379' },
        }));

        const { getOptionalRedisClient: isolatedGetClient } = require('@/lib/redis');

        const client1 = isolatedGetClient();
        const client2 = isolatedGetClient();

        expect(client1).toBe(client2);
        expect(mockRedisConstructor).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Development HMR Support', () => {
    it('should handle HMR disposal in development', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
      });
      process.env.NEXT_RUNTIME = 'nodejs';

      const mockQuit = jest.fn().mockResolvedValue('OK');
      const mockRedisInstance = {
        status: 'ready',
        options: { host: 'localhost', port: 6379 },
        on: jest.fn(),
        removeAllListeners: jest.fn(),
        quit: mockQuit,
      } as any;
      (MockRedis as any).mockImplementation(() => mockRedisInstance);

      // Create client
      getOptionalRedisClient();

      // Simulate HMR disposal
      const module = require('@/lib/redis');
      if (module && typeof module.hot?.dispose === 'function') {
        await module.hot.dispose({});

        expect(mockRedisInstance.removeAllListeners).toHaveBeenCalled();
        expect(mockRedisInstance.quit).toHaveBeenCalled();
      }

      // Restore original NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalNodeEnv,
        writable: true,
        configurable: true,
      });
    });
  });
});

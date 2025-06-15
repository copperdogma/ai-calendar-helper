import * as Sentry from '@sentry/nextjs';

// instrumentation.ts
export async function register() {
  const runtime = process.env.NEXT_RUNTIME;
  if (runtime === 'nodejs') {
    // Log that instrumentation is running (optional, for your confirmation)
    console.log('[Instrumentation] Initializing server-side components...');

    await import('./sentry.server.config');

    // Skip Redis client when running Playwright E2E to reduce dependencies
    if (process.env.NEXT_PUBLIC_IS_E2E_TEST_ENV !== 'true') {
      // Use eval-based dynamic import so the Edge bundle doesn't include ioredis.
      // We cannot rely on the `@/` alias inside an eval'd string (it isn't resolved at runtime),
      // so we hop two levels up from `.next/server/instrumentation.js` to project root, then into `lib/redis`.
      // The path is resolved at *runtime* from the compiled `.next/server` directory, so TypeScript
      // cannot verify it. We suppress the type error accordingly.
      try {
        // Dynamically import Node built-in modules only inside the Node.js runtime branch to avoid
        // bundler issues when generating edge-compatible code.
        const path = await eval("import('path')");
        const { pathToFileURL } = await eval("import('url')");

        const redisPath = pathToFileURL(path.join(process.cwd(), 'lib', 'redis.js')).href;
        const { getOptionalRedisClient } = await import(redisPath);
        const redisClient = getOptionalRedisClient();

        const gracefulShutdown = async (signal: string) => {
          console.log(`Received ${signal}, shutting down gracefully...`);
          if (redisClient) {
            try {
              await redisClient.quit();
              console.log('Redis client disconnected successfully.');
            } catch (err) {
              console.error('Error during Redis disconnection:', err);
            }
          }
          process.exit(0);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
      } catch (redisImportErr) {
        console.warn(
          '[Instrumentation] Redis client import failed – continuing without Redis:',
          redisImportErr
        );
      }
    }

    console.log('[Instrumentation] Redis client initialization sequence completed.');
  } else if (runtime === 'edge') {
    await import('./sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;

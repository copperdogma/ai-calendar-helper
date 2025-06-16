import * as Sentry from '@sentry/nextjs';
import { initializeRedis } from './lib/redis';

// instrumentation.ts
export async function register() {
  const runtime = process.env.NEXT_RUNTIME;

  if (runtime === 'nodejs') {
    // Initialize Sentry first.
    await import('./sentry.server.config');
    console.log('[Instrumentation] Initializing Node.js-specific components...');

    // Now that package.json handles the `ioredis` dependency for the browser,
    // we can directly initialize Redis without complex dynamic imports.
    initializeRedis();
  } else if (runtime === 'edge') {
    // This block runs only in the Edge runtime.
    // console.log('[Instrumentation] Initializing Edge-specific components...');
    await import('./sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;

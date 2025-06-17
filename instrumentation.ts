import * as Sentry from '@sentry/nextjs';
// Use project alias to avoid Next.js path resolution issues and reduce relative path confusion
import { initializeRedis } from '@/lib/redis';

// instrumentation.ts
export async function register() {
  // Skip expensive instrumentation during automated test runs to avoid flakiness
  if (process.env.NODE_ENV === 'test') {
    console.log('[Instrumentation] Skipping instrumentation in test environment.');
    return;
  }

  const runtime = process.env.NEXT_RUNTIME;

  if (runtime === 'nodejs') {
    // Initialize Sentry first.
    await import('./sentry.server.config');
    console.log('[Instrumentation] Initializing Node.js-specific components...');

    // Initialize Redis only when a URL is configured.
    initializeRedis();
  } else if (runtime === 'edge') {
    // This block runs only in the Edge runtime.
    // console.log('[Instrumentation] Initializing Edge-specific components...');
    await import('./sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;

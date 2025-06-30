import * as Sentry from '@sentry/nextjs';

// Store reference to scheduler process
// let _schedulerProcess: NodeJS.Timeout | null = null;

// instrumentation.ts
export async function register() {
  // Initialize Sentry if in production
  if (process.env.SENTRY_DSN && process.env.NODE_ENV === 'production') {
    const Sentry = await import('@sentry/nextjs');
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 1.0,
    });
  }

  const runtime = process.env.NEXT_RUNTIME;
  const version = require('./package.json').version;
  console.log(`[AI-Calendar-Helper v${version}] Initializing runtime: ${runtime}`);

  if (runtime === 'nodejs') {
    // The code here runs only in the Node.js runtime.

    // Initialize Redis connection
    const { initializeRedis } = await import('@/lib/redis');
    initializeRedis();

    // Bootstrap app services (but only in Node.js runtime to avoid webpack issues)
    try {
      console.log('[BOOTSTRAP] Starting in-process scheduler initialization...');

      // Use conditional dynamic import to avoid webpack static analysis
      if (typeof process !== 'undefined' && process.versions?.node) {
        const { initializeSchedulers } = await import('@/lib/bootstrap');
        await initializeSchedulers();
        console.log('[BOOTSTRAP] ✅ Schedulers initialized successfully');
      }
    } catch (error) {
      console.error('[BOOTSTRAP] Error initializing schedulers:', error);
    }
  } else if (runtime === 'edge') {
    // This block runs only in the Edge runtime.
    console.log('⚠️ Edge runtime detected. Some features may be limited.');
  }
}

export const onRequestError = Sentry.captureRequestError;

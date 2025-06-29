import * as Sentry from '@sentry/nextjs';

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

    // TODO: Re-enable bootstrap after resolving nodemailer build conflicts
    // Temporarily disabled to fix deployment build issues
    console.log('[BOOTSTRAP] Schedulers temporarily disabled for deployment build fix');

    // Only initialize server-side code in Node.js runtime and not during build
    // if (typeof window === 'undefined' &&
    //     typeof process !== 'undefined' &&
    //     process.versions?.node &&
    //     process.env.NODE_ENV !== undefined &&
    //     process.env.NEXT_PHASE !== 'phase-production-build') {
    //   try {
    //     console.log('[BOOTSTRAP] Initializing schedulers...');
    //     // Dynamic import to avoid loading server-only code in browser/edge contexts
    //     await import('./lib/bootstrap');
    //     // Bootstrap auto-executes on import
    //   } catch (error) {
    //     console.error('[BOOTSTRAP] Failed to initialize server bootstrap:', error);
    //   }
    // } else {
    //   console.log('[BOOTSTRAP] Skipping scheduler initialization during build phase');
    // }
  } else if (runtime === 'edge') {
    // This block runs only in the Edge runtime.
    console.log('⚠️ Edge runtime detected. Some features may be limited.');
  }
}

export const onRequestError = Sentry.captureRequestError;

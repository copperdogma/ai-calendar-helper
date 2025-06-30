/**
 * Application Bootstrap
 *
 * Initializes background services and schedulers when the application starts.
 */

async function initializeSchedulers() {
  // Only run in Node.js environment at runtime (not during build)
  if (
    typeof window !== 'undefined' ||
    !process.versions?.node ||
    process.env.NEXT_PHASE === 'phase-production-build'
  ) {
    return;
  }

  try {
    console.log('[BOOTSTRAP] Starting scheduler initialization...');

    // Import schedulers directly - Next.js should handle the dynamic imports properly
    try {
      await import('@/lib/scheduler/dailyReportScheduler');
      console.log('[BOOTSTRAP] Daily report scheduler loaded');
    } catch (error) {
      console.warn('[BOOTSTRAP] Failed to load daily report scheduler:', error);
    }

    try {
      await import('@/lib/scheduler/userJobScheduler');
      console.log('[BOOTSTRAP] User job scheduler loaded');
    } catch (error) {
      console.warn('[BOOTSTRAP] Failed to load user job scheduler:', error);
    }

    console.log('[BOOTSTRAP] Schedulers initialized successfully');
  } catch (error) {
    console.error('[BOOTSTRAP] Failed to initialize schedulers:', error);
    // Continue gracefully - don't crash the app if schedulers fail
  }
}

// Auto-execute bootstrap when module is imported
initializeSchedulers();

export { initializeSchedulers };

/**
 * Application Bootstrap
 *
 * Initializes background services and schedulers when the application starts.
 * Only loads server-side dependencies in appropriate environments.
 */

async function initializeSchedulers() {
  // Only run in Node.js environment
  if (typeof window !== 'undefined' || !process.versions?.node) {
    return;
  }

  try {
    // Dynamically import schedulers to avoid loading Node.js dependencies in edge/browser contexts
    await Promise.all([
      import('@/lib/scheduler/dailyReportScheduler'),
      import('@/lib/scheduler/userJobScheduler'),
    ]);

    // Schedulers auto-start on import
    console.log('[BOOTSTRAP] Schedulers initialized successfully');
  } catch (error) {
    console.error('[BOOTSTRAP] Failed to initialize schedulers:', error);
  }
}

// Auto-execute bootstrap when module is imported
initializeSchedulers();

export { initializeSchedulers };

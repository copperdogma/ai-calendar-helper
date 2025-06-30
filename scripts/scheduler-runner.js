#!/usr/bin/env node

/**
 * Standalone Scheduler Runner
 *
 * This script runs the schedulers in a separate Node.js process,
 * completely independent of the Next.js build system to avoid webpack conflicts.
 */

const path = require('path');

// Set up environment
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

console.log('[SCHEDULER-RUNNER] Starting independent scheduler process...');
console.log('[SCHEDULER-RUNNER] Node.js version:', process.version);
console.log('[SCHEDULER-RUNNER] Environment:', process.env.NODE_ENV);

async function startSchedulers() {
  try {
    // Use tsx to register TypeScript support
    console.log('[SCHEDULER-RUNNER] Registering TypeScript support...');
    require('tsx/cjs');

    // Import and initialize schedulers
    console.log('[SCHEDULER-RUNNER] Loading daily report scheduler...');
    const dailySchedulerPath = path.resolve(__dirname, '../lib/scheduler/dailyReportScheduler.ts');
    const dailyScheduler = require(dailySchedulerPath);

    console.log('[SCHEDULER-RUNNER] Loading user job scheduler...');
    const userJobSchedulerPath = path.resolve(__dirname, '../lib/scheduler/userJobScheduler.ts');
    const userJobScheduler = require(userJobSchedulerPath);

    console.log('[SCHEDULER-RUNNER] ✅ Schedulers initialized successfully');

    // Check status using available exports
    const dailyStatus = dailyScheduler.getScheduledTaskInfo?.()?.isScheduled
      ? 'ACTIVE'
      : 'INACTIVE';
    const userJobStatus = userJobScheduler.getUserJobScheduler?.()?.getStatus?.()?.isRunning
      ? 'ACTIVE'
      : 'INACTIVE';

    console.log('[SCHEDULER-RUNNER] Daily report scheduler:', dailyStatus);
    console.log('[SCHEDULER-RUNNER] User job scheduler:', userJobStatus);

    // Keep the process alive
    console.log('[SCHEDULER-RUNNER] Schedulers running. Process will stay alive until terminated.');

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('[SCHEDULER-RUNNER] Received SIGTERM, shutting down schedulers gracefully...');
      try {
        // Try to stop schedulers gracefully
        userJobScheduler.getUserJobScheduler?.()?.stop?.();
      } catch (e) {
        console.error('[SCHEDULER-RUNNER] Error during graceful shutdown:', e);
      }
      process.exit(0);
    });

    process.on('SIGINT', () => {
      console.log('[SCHEDULER-RUNNER] Received SIGINT, shutting down schedulers gracefully...');
      try {
        // Try to stop schedulers gracefully
        userJobScheduler.getUserJobScheduler?.()?.stop?.();
      } catch (e) {
        console.error('[SCHEDULER-RUNNER] Error during graceful shutdown:', e);
      }
      process.exit(0);
    });
  } catch (error) {
    console.error('[SCHEDULER-RUNNER] Failed to initialize schedulers:', error);
    process.exit(1);
  }
}

// Only start if this script is run directly (not imported)
if (require.main === module) {
  startSchedulers();
}

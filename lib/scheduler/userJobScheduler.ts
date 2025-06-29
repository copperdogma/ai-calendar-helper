import cron from 'node-cron';
import { UserJobService, UserJobWithUser } from '@/lib/services/userJob.service';
import { detectNovelEvents } from '@/lib/novelEvents/NovelEventsService';
import { getUserOAuthClient } from '@/lib/google/getOAuthClient';
import { prisma } from '@/lib/prisma';

// Store reference to current scheduled task to prevent duplicates
let currentScheduledTask: ReturnType<typeof cron.schedule> | null = null;

export interface SchedulerStatus {
  isRunning: boolean;
  lastCacheRefresh: Date;
  cachedJobsCount: number;
}

interface CachedJobs {
  jobs: UserJobWithUser[];
  lastRefresh: Date;
}

export class UserJobScheduler {
  private static _instance: UserJobScheduler | null = null;
  private userJobService: UserJobService;
  private jobCache: CachedJobs | null = null;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.userJobService = new UserJobService();
    this.scheduleJobs();
  }

  public static getInstance(): UserJobScheduler {
    if (!UserJobScheduler._instance) {
      UserJobScheduler._instance = new UserJobScheduler();
    }
    return UserJobScheduler._instance;
  }

  private scheduleJobs(): void {
    // Cancel existing scheduled task if one exists
    if (currentScheduledTask) {
      console.log('[USER-JOB-SCHEDULER] Stopping existing scheduled task');
      currentScheduledTask.stop();
      currentScheduledTask = null;
    }

    console.log('[USER-JOB-SCHEDULER] Scheduling user job discovery: * * * * * (every minute)');

    currentScheduledTask = cron.schedule(
      '* * * * *', // Every minute
      async () => {
        await this.runJobDiscovery();
      },
      { timezone: 'UTC' }
    );
  }

  private async runJobDiscovery(): Promise<void> {
    try {
      console.log('[USER-JOB-SCHEDULER] Starting job discovery');

      const now = new Date();
      let jobsDue: UserJobWithUser[];

      // Check if cache is valid
      if (
        this.jobCache &&
        now.getTime() - this.jobCache.lastRefresh.getTime() < this.CACHE_TTL_MS
      ) {
        // Filter cached jobs that are actually due
        jobsDue = this.jobCache.jobs.filter(
          job => job.enabled && job.nextRun && new Date(job.nextRun) <= now
        );
        console.log(`[USER-JOB-SCHEDULER] Using cached jobs, found ${jobsDue.length} due`);
      } else {
        // Refresh cache
        const allJobs = await this.userJobService.getJobsDueToRun(now);
        this.jobCache = {
          jobs: allJobs,
          lastRefresh: now,
        };
        jobsDue = allJobs;
        console.log(`[USER-JOB-SCHEDULER] Refreshed cache, found ${jobsDue.length} jobs due`);
      }

      if (jobsDue.length === 0) {
        console.log('[USER-JOB-SCHEDULER] No jobs due to run');
        return;
      }

      // Process each job
      for (const job of jobsDue) {
        await this.executeJob(job);
      }

      console.log('[USER-JOB-SCHEDULER] Job discovery completed');
    } catch (error) {
      console.error('[USER-JOB-SCHEDULER] Error discovering jobs:', error);
    }
  }

  private async executeJob(job: UserJobWithUser): Promise<void> {
    const { userId, jobType, user } = job;
    console.log(`[USER-JOB-SCHEDULER] Executing ${jobType} job for user ${user.email || userId}`);

    try {
      if (jobType === 'NOVEL_EVENTS') {
        await this.executeNovelEventsJob(userId);
      } else {
        throw new Error(`Unknown job type: ${jobType}`);
      }

      // Update last run time
      await this.userJobService.updateLastRun(userId, jobType, new Date());
      console.log(`[USER-JOB-SCHEDULER] Successfully completed ${jobType} job for user ${userId}`);
    } catch (error) {
      console.error(
        `[USER-JOB-SCHEDULER] Error executing ${jobType} job for user ${userId}:`,
        error
      );

      // Log the failure
      await this.userJobService.logJobFailure(userId, jobType, error as Error);
    }
  }

  private async executeNovelEventsJob(userId: string): Promise<void> {
    // Get OAuth client for the user
    const oauthClient = await getUserOAuthClient(userId, prisma);

    // Execute novel events detection
    const novelEvents = await detectNovelEvents(userId, {
      prisma,
      calendarClient: oauthClient,
    });

    console.log(`[USER-JOB-SCHEDULER] Found ${novelEvents.length} novel events for user ${userId}`);

    // TODO: In Phase 2, integrate with email service to send novel events summary
    // For now, just log the count
  }

  public getStatus(): SchedulerStatus {
    return {
      isRunning: currentScheduledTask !== null,
      lastCacheRefresh: this.jobCache?.lastRefresh || new Date(),
      cachedJobsCount: this.jobCache?.jobs.length || 0,
    };
  }

  public stop(): void {
    if (currentScheduledTask) {
      console.log('[USER-JOB-SCHEDULER] Stopping scheduler');
      currentScheduledTask.stop();
      currentScheduledTask = null;
    }
  }

  public start(): void {
    if (!currentScheduledTask) {
      console.log('[USER-JOB-SCHEDULER] Starting scheduler');
      this.scheduleJobs();
    }
  }

  public clearCache(): void {
    this.jobCache = null;
    console.log('[USER-JOB-SCHEDULER] Cache cleared');
  }
}

// Export singleton instance function for easy access
export const getUserJobScheduler = () => UserJobScheduler.getInstance();

// Immediately start scheduler upon import (for bootstrap integration)
UserJobScheduler.getInstance();

// Import moved to dynamic eval to avoid webpack conflicts
import { UserJobService, UserJobWithUser } from '@/lib/services/userJob.service';
import { detectNovelEvents } from '@/lib/novelEvents/NovelEventsService';
import { getUserOAuthClient } from '@/lib/google/getOAuthClient';
import { prisma } from '@/lib/prisma';

// Store reference to current scheduled task to prevent duplicates
let currentScheduledTask: { stop: () => void } | null = null;

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
    // Start scheduling in background (fire and forget)
    this.scheduleJobs().catch(error => {
      console.error('[USER-JOB-SCHEDULER] Failed to start scheduler:', error);
    });
  }

  public static getInstance(): UserJobScheduler {
    if (!UserJobScheduler._instance) {
      UserJobScheduler._instance = new UserJobScheduler();
    }
    return UserJobScheduler._instance;
  }

  private async scheduleJobs(): Promise<void> {
    // Cancel existing scheduled task if one exists
    if (currentScheduledTask) {
      console.log('[USER-JOB-SCHEDULER] Stopping existing scheduled task');
      currentScheduledTask.stop();
      currentScheduledTask = null;
    }

    console.log('[USER-JOB-SCHEDULER] Scheduling user job discovery: * * * * * (every minute)');

    // Use eval to hide node-cron import from webpack static analysis
    const cronModule = await eval("import('node-cron')");
    const cron = cronModule.default;

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
    // Get user info for email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user?.email) {
      console.error(
        `[USER-JOB-SCHEDULER] User ${userId} has no email address, skipping novel events job`
      );
      return;
    }

    // Get OAuth client for the user
    const oauthClient = await getUserOAuthClient(userId, prisma);

    // Create Google Calendar client
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let googleApi: { google: { calendar: (options: { version: string; auth: any }) => any } };
    try {
      googleApi = await eval("import('googleapis')");
    } catch {
      console.error(`[USER-JOB-SCHEDULER] Google APIs not available for user ${userId}`);
      return;
    }
    const { google } = googleApi;
    const calendar = google.calendar({ version: 'v3', auth: oauthClient });

    // Import calendar client
    const { GoogleApiCalendarClient } = await import('@/lib/google/calendarService');
    const calendarClient = new GoogleApiCalendarClient(calendar);

    // Execute novel events detection
    const novelEvents = await detectNovelEvents(userId, {
      prisma,
      calendarClient,
    });

    console.log(`[USER-JOB-SCHEDULER] Found ${novelEvents.length} novel events for user ${userId}`);

    if (novelEvents.length === 0) {
      console.log(`[USER-JOB-SCHEDULER] No novel events found for user ${userId}, skipping email`);
      return;
    }

    // Build calendar names map for email formatting
    let calendarNames: Record<string, string> = {};
    try {
      const list = await calendarClient.listCalendars();
      list.items?.forEach((c: { id?: string; summaryOverride?: string; summary?: string }) => {
        if (c.id) {
          calendarNames[c.id] = c.summaryOverride ?? c.summary ?? c.id;
        }
      });
    } catch (error) {
      console.warn(
        `[USER-JOB-SCHEDULER] Could not fetch calendar names for user ${userId}:`,
        error
      );
    }

    // Send novel events email
    try {
      // Use eval to completely hide email import from webpack static analysis
      const emailModule = await eval("import('@/lib/email')");
      const { sendNovelEventsReport } = emailModule;

      await sendNovelEventsReport({
        to: user.email,
        events: novelEvents.map(n => ({
          summary: (n.event as { title?: string }).title ?? null,
          start:
            (n.event as { start?: { toISOString?: () => string } }).start?.toISOString?.() ?? null,
          noveltyScore: n.noveltyScore,
          calendarId: (n.event as { calendarId?: string }).calendarId ?? undefined,
        })),
        windowStart: new Date(),
        windowEnd: (() => {
          const d = new Date();
          d.setDate(d.getDate() + 14); // use same default window as detection logic
          return d;
        })(),
        calendarNames,
      });

      console.log(
        `[USER-JOB-SCHEDULER] Successfully sent novel events email to ${user.email} with ${novelEvents.length} events`
      );
    } catch (error) {
      console.error(
        `[USER-JOB-SCHEDULER] Failed to send novel events email to ${user.email}:`,
        error
      );
      throw error; // Re-throw to trigger job failure logging
    }
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

  public async start(): Promise<void> {
    if (!currentScheduledTask) {
      console.log('[USER-JOB-SCHEDULER] Starting scheduler');
      await this.scheduleJobs();
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

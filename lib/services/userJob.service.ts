import { prisma } from '@/lib/prisma';
import { JobType, SchedulePreset, UserJobSchedule, JobFailure, User } from '@prisma/client';

export type UserJobWithUser = UserJobSchedule & {
  user: User;
};

export class UserJobService {
  /**
   * Create a new user job with the specified schedule
   */
  async createJob(
    userId: string,
    jobType: JobType,
    schedule: SchedulePreset,
    scheduleTime?: string,
    scheduleDayOfWeek?: number,
    scheduleDayOfMonth?: number
  ): Promise<UserJobSchedule> {
    const nextRun = this.calculateNextRun(
      schedule,
      new Date(),
      scheduleTime,
      scheduleDayOfWeek,
      scheduleDayOfMonth
    );

    return prisma.userJobSchedule.create({
      data: {
        userId,
        jobType,
        schedule,
        scheduleTime,
        scheduleDayOfWeek,
        scheduleDayOfMonth,
        enabled: true,
        nextRun,
      },
    });
  }

  /**
   * Enable a user job and calculate the next run time
   */
  async enableJob(userId: string, jobType: JobType): Promise<UserJobSchedule> {
    // First get the current job to access its schedule
    const currentJob = await prisma.userJobSchedule.findUnique({
      where: {
        userId_jobType: {
          userId,
          jobType,
        },
      },
    });

    if (!currentJob) {
      throw new Error(`Job ${jobType} not found for user ${userId}`);
    }

    const nextRun = this.calculateNextRun(
      currentJob.schedule,
      new Date(),
      currentJob.scheduleTime || undefined,
      currentJob.scheduleDayOfWeek || undefined,
      currentJob.scheduleDayOfMonth || undefined
    );

    return prisma.userJobSchedule.update({
      where: {
        userId_jobType: {
          userId,
          jobType,
        },
      },
      data: {
        enabled: true,
        nextRun,
      },
    });
  }

  /**
   * Disable a user job
   */
  async disableJob(userId: string, jobType: JobType): Promise<UserJobSchedule> {
    return prisma.userJobSchedule.update({
      where: {
        userId_jobType: {
          userId,
          jobType,
        },
      },
      data: {
        enabled: false,
        nextRun: null,
      },
    });
  }

  /**
   * Get the status of a user job
   */
  async getJobStatus(userId: string, jobType: JobType): Promise<UserJobSchedule | null> {
    return prisma.userJobSchedule.findUnique({
      where: {
        userId_jobType: {
          userId,
          jobType,
        },
      },
    });
  }

  /**
   * Update the last run time and calculate next run
   */
  async updateLastRun(userId: string, jobType: JobType, lastRun: Date): Promise<UserJobSchedule> {
    // Get the current job to access its schedule
    const currentJob = await prisma.userJobSchedule.findUnique({
      where: {
        userId_jobType: {
          userId,
          jobType,
        },
      },
    });

    if (!currentJob) {
      throw new Error(`Job ${jobType} not found for user ${userId}`);
    }

    const nextRun = this.calculateNextRun(
      currentJob.schedule,
      lastRun,
      currentJob.scheduleTime || undefined,
      currentJob.scheduleDayOfWeek || undefined,
      currentJob.scheduleDayOfMonth || undefined
    );

    return prisma.userJobSchedule.update({
      where: {
        userId_jobType: {
          userId,
          jobType,
        },
      },
      data: {
        lastRun,
        nextRun,
      },
    });
  }

  /**
   * Get all jobs that are due to run
   */
  async getJobsDueToRun(now: Date = new Date()): Promise<UserJobWithUser[]> {
    return prisma.userJobSchedule.findMany({
      where: {
        enabled: true,
        nextRun: {
          lte: now,
        },
      },
      include: {
        user: true,
      },
    });
  }

  /**
   * Log a job failure
   */
  async logJobFailure(userId: string, jobType: JobType, error: Error): Promise<JobFailure> {
    return prisma.jobFailure.create({
      data: {
        userId,
        jobType,
        errorMessage: error.message,
        errorDetails: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
      },
    });
  }

  /**
   * Get all jobs for a user
   */
  async getUserJobs(userId: string): Promise<UserJobSchedule[]> {
    return prisma.userJobSchedule.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Update a job's schedule
   */
  async updateJobSchedule(
    userId: string,
    jobType: JobType,
    schedule: SchedulePreset,
    scheduleTime?: string,
    scheduleDayOfWeek?: number,
    scheduleDayOfMonth?: number
  ): Promise<UserJobSchedule> {
    const nextRun = this.calculateNextRun(
      schedule,
      new Date(),
      scheduleTime,
      scheduleDayOfWeek,
      scheduleDayOfMonth
    );

    return prisma.userJobSchedule.update({
      where: {
        userId_jobType: {
          userId,
          jobType,
        },
      },
      data: {
        schedule,
        scheduleTime,
        scheduleDayOfWeek,
        scheduleDayOfMonth,
        nextRun,
      },
    });
  }

  /**
   * Get job failures for a user
   */
  async getJobFailures(userId: string, jobType?: JobType): Promise<JobFailure[]> {
    return prisma.jobFailure.findMany({
      where: {
        userId,
        ...(jobType && { jobType }),
      },
      orderBy: {
        failedAt: 'desc',
      },
    });
  }

  /**
   * Mark a job failure as retried
   */
  async markFailureRetried(failureId: string, retriedBy: string): Promise<JobFailure> {
    return prisma.jobFailure.update({
      where: { id: failureId },
      data: {
        retriedAt: new Date(),
        retriedBy,
      },
    });
  }

  /**
   * Calculate the next run time based on schedule and base date
   */
  private calculateNextRun(
    schedule: SchedulePreset,
    baseDate: Date,
    scheduleTime?: string,
    scheduleDayOfWeek?: number,
    scheduleDayOfMonth?: number
  ): Date {
    const nextRun = new Date(baseDate);

    // Parse the schedule time or default to 9:00 AM
    let hours = 9;
    let minutes = 0;
    if (scheduleTime) {
      const [h, m] = scheduleTime.split(':').map(Number);
      hours = h;
      minutes = m;
    }

    switch (schedule) {
      case 'DAILY':
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case 'WEEKLY':
        // Set to next occurrence of the specified day of week
        const targetDay = scheduleDayOfWeek ?? 1; // Default to Monday
        const currentDay = nextRun.getDay();
        const daysUntilTarget = (targetDay - currentDay + 7) % 7;
        nextRun.setDate(nextRun.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
        break;
      case 'MONTHLY':
        // Set to the specified day of the next month
        const targetDate = scheduleDayOfMonth ?? 1; // Default to 1st
        nextRun.setMonth(nextRun.getMonth() + 1);
        nextRun.setDate(targetDate);
        break;
      default:
        throw new Error(`Unsupported schedule: ${schedule}`);
    }

    // Set the time
    nextRun.setHours(hours, minutes, 0, 0);
    return nextRun;
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { withApiLogger } from '@/lib/services/api-logger-service';
import { auth } from '@/lib/auth';
import { UserJobService } from '@/lib/services/userJob.service';
import { JobType, SchedulePreset } from '@prisma/client';
import pino from 'pino';
import { ApiError } from '@/lib/errors/ApiError';
import { handleApiError } from '@/lib/errors/handleApiError';

/**
 * Update User Job Schedule - PUT /api/user/jobs/[jobType]
 *
 * Updates the schedule for a specific job type.
 * Requires: { schedule: SchedulePreset }
 */
export const PUT = withApiLogger(
  async (request: NextRequest, logger: pino.Logger): Promise<NextResponse> => {
    // Extract jobType from URL path
    const pathParts = request.nextUrl.pathname.split('/');
    const jobType = pathParts[pathParts.length - 1];
    try {
      // Get current session
      const session = await auth();

      // Check if user is authenticated
      if (!session?.user?.id) {
        throw new ApiError(401, 'You must be logged in to access this resource.', 'UNAUTHORIZED');
      }

      logger.info({ userId: session.user.id, jobType }, 'Updating job schedule');

      // Validate jobType
      if (!Object.values(JobType).includes(jobType as JobType)) {
        throw new ApiError(400, 'Invalid jobType', 'INVALID_JOB_TYPE');
      }

      // Parse request body
      const body = await request.json();
      const { schedule, scheduleTime, scheduleDayOfWeek, scheduleDayOfMonth } = body;

      // Validate schedule
      if (!schedule || !Object.values(SchedulePreset).includes(schedule)) {
        throw new ApiError(400, 'Invalid schedule', 'INVALID_SCHEDULE');
      }

      // Update the job schedule
      const userJobService = new UserJobService();
      const job = await userJobService.updateJobSchedule(
        session.user.id,
        jobType as JobType,
        schedule,
        scheduleTime,
        scheduleDayOfWeek,
        scheduleDayOfMonth
      );

      logger.info(
        { userId: session.user.id, jobType, schedule, jobId: job.id },
        'Successfully updated job schedule'
      );

      // Return updated job
      return NextResponse.json({ job });
    } catch (error) {
      return handleApiError(error);
    }
  }
);

/**
 * Disable User Job - DELETE /api/user/jobs/[jobType]
 *
 * Disables a specific job type for the current user.
 */
export const DELETE = withApiLogger(
  async (request: NextRequest, logger: pino.Logger): Promise<NextResponse> => {
    // Extract jobType from URL path
    const pathParts = request.nextUrl.pathname.split('/');
    const jobType = pathParts[pathParts.length - 1];

    try {
      // Get current session
      const session = await auth();

      // Check if user is authenticated
      if (!session?.user?.id) {
        throw new ApiError(401, 'You must be logged in to access this resource.', 'UNAUTHORIZED');
      }

      logger.info({ userId: session.user.id, jobType }, 'Disabling user job');

      // Validate jobType
      if (!Object.values(JobType).includes(jobType as JobType)) {
        throw new ApiError(400, 'Invalid jobType', 'INVALID_JOB_TYPE');
      }

      // Disable the job
      const userJobService = new UserJobService();
      await userJobService.disableJob(session.user.id, jobType as JobType);

      logger.info({ userId: session.user.id, jobType }, 'Successfully disabled user job');

      // Return success message
      return NextResponse.json({ message: 'Job disabled successfully' });
    } catch (error) {
      return handleApiError(error);
    }
  }
);

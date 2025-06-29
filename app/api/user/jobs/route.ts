import { NextRequest, NextResponse } from 'next/server';
import { withApiLogger } from '@/lib/services/api-logger-service';
import { auth } from '@/lib/auth';
import { UserJobService } from '@/lib/services/userJob.service';
import { JobType, SchedulePreset } from '@prisma/client';
import pino from 'pino';
import { ApiError } from '@/lib/errors/ApiError';
import { handleApiError } from '@/lib/errors/handleApiError';

/**
 * Get User Jobs - GET /api/user/jobs
 *
 * Returns all background jobs configured for the current user.
 * Requires authentication.
 */
export const GET = withApiLogger(
  async (_request: NextRequest, logger: pino.Logger): Promise<NextResponse> => {
    try {
      // Get current session
      const session = await auth();

      // Check if user is authenticated
      if (!session?.user?.id) {
        throw new ApiError(401, 'You must be logged in to access this resource.', 'UNAUTHORIZED');
      }

      logger.info({ userId: session.user.id }, 'Fetching user jobs');

      // Get user jobs
      const userJobService = new UserJobService();
      const jobs = await userJobService.getUserJobs(session.user.id);

      logger.info(
        { userId: session.user.id, jobCount: jobs.length },
        'Successfully fetched user jobs'
      );

      // Return jobs
      return NextResponse.json({ jobs });
    } catch (error) {
      return handleApiError(error);
    }
  }
);

/**
 * Create User Job - POST /api/user/jobs
 *
 * Creates a new background job for the current user.
 * Requires: { jobType: JobType, schedule: SchedulePreset }
 */
export const POST = withApiLogger(
  async (request: NextRequest, logger: pino.Logger): Promise<NextResponse> => {
    try {
      // Get current session
      const session = await auth();

      // Check if user is authenticated
      if (!session?.user?.id) {
        throw new ApiError(401, 'You must be logged in to access this resource.', 'UNAUTHORIZED');
      }

      // Parse request body
      const body = await request.json();
      const { jobType, schedule, scheduleTime, scheduleDayOfWeek, scheduleDayOfMonth } = body;

      logger.info(
        {
          userId: session.user.id,
          jobType,
          schedule,
          scheduleTime,
          scheduleDayOfWeek,
          scheduleDayOfMonth,
        },
        'Creating user job'
      );

      // Validate required fields
      if (!jobType || !schedule) {
        throw new ApiError(400, 'Missing required fields: jobType and schedule', 'INVALID_INPUT');
      }

      // Validate jobType
      if (!Object.values(JobType).includes(jobType)) {
        throw new ApiError(400, 'Invalid jobType', 'INVALID_JOB_TYPE');
      }

      // Validate schedule
      if (!Object.values(SchedulePreset).includes(schedule)) {
        throw new ApiError(400, 'Invalid schedule', 'INVALID_SCHEDULE');
      }

      // Create the job with time parameters
      const userJobService = new UserJobService();
      const job = await userJobService.createJob(
        session.user.id,
        jobType,
        schedule,
        scheduleTime,
        scheduleDayOfWeek,
        scheduleDayOfMonth
      );

      logger.info(
        { userId: session.user.id, jobId: job.id, jobType, schedule },
        'Successfully created user job'
      );

      // Return created job
      return NextResponse.json({ job }, { status: 201 });
    } catch (error) {
      return handleApiError(error);
    }
  }
);

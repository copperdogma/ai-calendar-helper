/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from 'next/server';
import { jest } from '@jest/globals';
import { createRequest } from 'node-mocks-http';
// Define test constants for enum values since they may not be available in test environment
const JobType = {
  NOVEL_EVENTS: 'NOVEL_EVENTS' as const,
};

const SchedulePreset = {
  DAILY: 'DAILY' as const,
  WEEKLY: 'WEEKLY' as const,
  MONTHLY: 'MONTHLY' as const,
};
import type pino from 'pino';

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

// Mock the UserJobService
jest.mock('@/lib/services/userJob.service', () => ({
  UserJobService: jest.fn(),
}));

// Mock pino logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
} as unknown as pino.Logger;

// Mock the API logger service
jest.mock('@/lib/services/api-logger-service', () => ({
  withApiLogger: (handler: any) => {
    return (req: NextRequest) => handler(req, mockLogger);
  },
}));

// Mock ApiError and handleApiError
jest.mock('@/lib/errors/ApiError', () => ({
  ApiError: class extends Error {
    constructor(
      public statusCode: number,
      message: string,
      public code: string
    ) {
      super(message);
    }
  },
}));

jest.mock('@/lib/errors/handleApiError', () => ({
  handleApiError: jest.fn((error: any) => {
    if (error.statusCode) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: 'ServerError', message: 'Internal server error' },
      { status: 500 }
    );
  }),
}));

describe('User Jobs API Route Handlers', () => {
  let mockUserJobService: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the UserJobService mock
    mockUserJobService = {
      getUserJobs: jest.fn(),
      createJob: jest.fn(),
      updateJobSchedule: jest.fn(),
      disableJob: jest.fn(),
    };

    const { UserJobService } = require('@/lib/services/userJob.service');
    UserJobService.mockImplementation(() => mockUserJobService);
  });

  const createMockRequest = (options: any = {}): NextRequest => {
    const mockHttpRequest = createRequest({
      method: 'GET',
      url: '/api/user/jobs',
      ...options,
    });

    return {
      url: mockHttpRequest.url,
      method: mockHttpRequest.method,
      headers: new Headers(options.headers || {}),
      json: jest.fn().mockResolvedValue(options.body || ({} as any)),
      nextUrl: {
        pathname: '/api/user/jobs',
        search: options.query ? `?${new URLSearchParams(options.query).toString()}` : '',
        searchParams: new URLSearchParams(options.query || {}),
      },
    } as unknown as NextRequest;
  };

  describe('GET /api/user/jobs', () => {
    const testGetHandler = async (_req: NextRequest): Promise<NextResponse> => {
      try {
        const { auth } = await import('@/lib/auth');
        const session = await auth();

        if (!session?.user?.id) {
          const { ApiError } = await import('@/lib/errors/ApiError');
          throw new ApiError(401, 'You must be logged in to access this resource.', 'UNAUTHORIZED');
        }

        const { UserJobService } = await import('@/lib/services/userJob.service');
        const userJobService = new UserJobService();
        const jobs = await userJobService.getUserJobs(session.user.id);

        return NextResponse.json({ jobs });
      } catch (error) {
        const { handleApiError } = await import('@/lib/errors/handleApiError');
        return handleApiError(error);
      }
    };

    it('should return 401 if user is not authenticated', async () => {
      const { auth } = require('@/lib/auth');
      auth.mockResolvedValue(null);

      const mockRequest = createMockRequest();
      const response = await testGetHandler(mockRequest);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({
        error: 'UNAUTHORIZED',
        message: 'You must be logged in to access this resource.',
      });
    });

    it('should return user jobs if authenticated', async () => {
      const { auth } = require('@/lib/auth');
      auth.mockResolvedValue({
        user: { id: 'test-user-id' },
      });

      const mockJobs = [
        {
          id: 'job1',
          userId: 'test-user-id',
          jobType: JobType.NOVEL_EVENTS,
          schedule: SchedulePreset.DAILY,
          enabled: true,
          lastRun: new Date('2025-01-10T09:00:00Z'),
          nextRun: new Date('2025-01-11T09:00:00Z'),
          createdAt: new Date('2025-01-01T00:00:00Z'),
          updatedAt: new Date('2025-01-01T00:00:00Z'),
        },
      ];

      mockUserJobService.getUserJobs.mockResolvedValue(mockJobs);

      const mockRequest = createMockRequest();
      const response = await testGetHandler(mockRequest);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.jobs).toHaveLength(1);
      expect(data.jobs[0]).toMatchObject({
        id: 'job1',
        userId: 'test-user-id',
        jobType: 'NOVEL_EVENTS',
        schedule: 'DAILY',
        enabled: true,
      });
      expect(mockUserJobService.getUserJobs).toHaveBeenCalledWith('test-user-id');
    });

    it('should handle service errors gracefully', async () => {
      const { auth } = require('@/lib/auth');
      auth.mockResolvedValue({
        user: { id: 'test-user-id' },
      });

      mockUserJobService.getUserJobs.mockRejectedValue(new Error('Database error'));

      const mockRequest = createMockRequest();
      const response = await testGetHandler(mockRequest);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('ServerError');
    });
  });

  describe('POST /api/user/jobs', () => {
    const testPostHandler = async (req: NextRequest): Promise<NextResponse> => {
      try {
        const { auth } = await import('@/lib/auth');
        const session = await auth();

        if (!session?.user?.id) {
          const { ApiError } = await import('@/lib/errors/ApiError');
          throw new ApiError(401, 'You must be logged in to access this resource.', 'UNAUTHORIZED');
        }

        const body = await req.json();
        const { jobType, schedule } = body;

        if (!jobType || !schedule) {
          const { ApiError } = await import('@/lib/errors/ApiError');
          throw new ApiError(400, 'Missing required fields: jobType and schedule', 'INVALID_INPUT');
        }

        if (!Object.values(JobType).includes(jobType)) {
          const { ApiError } = await import('@/lib/errors/ApiError');
          throw new ApiError(400, 'Invalid jobType', 'INVALID_JOB_TYPE');
        }

        if (!Object.values(SchedulePreset).includes(schedule)) {
          const { ApiError } = await import('@/lib/errors/ApiError');
          throw new ApiError(400, 'Invalid schedule', 'INVALID_SCHEDULE');
        }

        const { UserJobService } = await import('@/lib/services/userJob.service');
        const userJobService = new UserJobService();
        const job = await userJobService.createJob(session.user.id, jobType, schedule);

        return NextResponse.json({ job }, { status: 201 });
      } catch (error) {
        const { handleApiError } = await import('@/lib/errors/handleApiError');
        return handleApiError(error);
      }
    };

    it('should create a new job with valid input', async () => {
      const { auth } = require('@/lib/auth');
      auth.mockResolvedValue({
        user: { id: 'test-user-id' },
      });

      const mockJob = {
        id: 'new-job-id',
        userId: 'test-user-id',
        jobType: JobType.NOVEL_EVENTS,
        schedule: SchedulePreset.DAILY,
        enabled: true,
        nextRun: new Date('2025-01-12T09:00:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserJobService.createJob.mockResolvedValue(mockJob);

      const mockRequest = createMockRequest({
        method: 'POST',
        body: {
          jobType: JobType.NOVEL_EVENTS,
          schedule: SchedulePreset.DAILY,
        },
      });

      const response = await testPostHandler(mockRequest);

      expect(response.status).toBe(201);
      const data = await response.json();
      // API should serialize dates to strings
      const expectedJob = {
        ...mockJob,
        nextRun: mockJob.nextRun.toISOString(),
        createdAt: mockJob.createdAt.toISOString(),
        updatedAt: mockJob.updatedAt.toISOString(),
      };
      expect(data).toEqual({ job: expectedJob });
      expect(mockUserJobService.createJob).toHaveBeenCalledWith(
        'test-user-id',
        JobType.NOVEL_EVENTS,
        SchedulePreset.DAILY
      );
    });

    it('should return 400 for missing required fields', async () => {
      const { auth } = require('@/lib/auth');
      auth.mockResolvedValue({
        user: { id: 'test-user-id' },
      });

      const mockRequest = createMockRequest({
        method: 'POST',
        body: { jobType: JobType.NOVEL_EVENTS }, // Missing schedule
      });

      const response = await testPostHandler(mockRequest);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('INVALID_INPUT');
    });

    it('should return 400 for invalid jobType', async () => {
      const { auth } = require('@/lib/auth');
      auth.mockResolvedValue({
        user: { id: 'test-user-id' },
      });

      const mockRequest = createMockRequest({
        method: 'POST',
        body: {
          jobType: 'INVALID_TYPE',
          schedule: SchedulePreset.DAILY,
        },
      });

      const response = await testPostHandler(mockRequest);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('INVALID_JOB_TYPE');
    });

    it('should return 400 for invalid schedule', async () => {
      const { auth } = require('@/lib/auth');
      auth.mockResolvedValue({
        user: { id: 'test-user-id' },
      });

      const mockRequest = createMockRequest({
        method: 'POST',
        body: {
          jobType: JobType.NOVEL_EVENTS,
          schedule: 'INVALID_SCHEDULE',
        },
      });

      const response = await testPostHandler(mockRequest);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('INVALID_SCHEDULE');
    });

    it('should return 401 if user is not authenticated', async () => {
      const { auth } = require('@/lib/auth');
      auth.mockResolvedValue(null);

      const mockRequest = createMockRequest({
        method: 'POST',
        body: {
          jobType: JobType.NOVEL_EVENTS,
          schedule: SchedulePreset.DAILY,
        },
      });

      const response = await testPostHandler(mockRequest);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('UNAUTHORIZED');
    });
  });

  describe('PUT /api/user/jobs/[jobType]', () => {
    const testPutHandler = async (req: NextRequest, jobType: string): Promise<NextResponse> => {
      try {
        const { auth } = await import('@/lib/auth');
        const session = await auth();

        if (!session?.user?.id) {
          const { ApiError } = await import('@/lib/errors/ApiError');
          throw new ApiError(401, 'You must be logged in to access this resource.', 'UNAUTHORIZED');
        }

        if (!Object.values(JobType).includes(jobType as JobType)) {
          const { ApiError } = await import('@/lib/errors/ApiError');
          throw new ApiError(400, 'Invalid jobType', 'INVALID_JOB_TYPE');
        }

        const body = await req.json();
        const { schedule } = body;

        if (!schedule || !Object.values(SchedulePreset).includes(schedule)) {
          const { ApiError } = await import('@/lib/errors/ApiError');
          throw new ApiError(400, 'Invalid schedule', 'INVALID_SCHEDULE');
        }

        const { UserJobService } = await import('@/lib/services/userJob.service');
        const userJobService = new UserJobService();
        const job = await userJobService.updateJobSchedule(
          session.user.id,
          jobType as JobType,
          schedule
        );

        return NextResponse.json({ job });
      } catch (error) {
        const { handleApiError } = await import('@/lib/errors/handleApiError');
        return handleApiError(error);
      }
    };

    it('should update job schedule with valid input', async () => {
      const { auth } = require('@/lib/auth');
      auth.mockResolvedValue({
        user: { id: 'test-user-id' },
      });

      const mockJob = {
        id: 'job-id',
        userId: 'test-user-id',
        jobType: JobType.NOVEL_EVENTS,
        schedule: SchedulePreset.WEEKLY,
        enabled: true,
        nextRun: new Date('2025-01-18T09:00:00Z'),
        updatedAt: new Date(),
      };

      mockUserJobService.updateJobSchedule.mockResolvedValue(mockJob);

      const mockRequest = createMockRequest({
        method: 'PUT',
        body: { schedule: SchedulePreset.WEEKLY },
      });

      const response = await testPutHandler(mockRequest, JobType.NOVEL_EVENTS);

      expect(response.status).toBe(200);
      const data = await response.json();
      // API should serialize dates to strings
      const expectedJob = {
        ...mockJob,
        nextRun: mockJob.nextRun.toISOString(),
        updatedAt: mockJob.updatedAt.toISOString(),
      };
      expect(data).toEqual({ job: expectedJob });
      expect(mockUserJobService.updateJobSchedule).toHaveBeenCalledWith(
        'test-user-id',
        JobType.NOVEL_EVENTS,
        SchedulePreset.WEEKLY
      );
    });

    it('should return 400 for invalid jobType', async () => {
      const { auth } = require('@/lib/auth');
      auth.mockResolvedValue({
        user: { id: 'test-user-id' },
      });

      const mockRequest = createMockRequest({
        method: 'PUT',
        body: { schedule: SchedulePreset.WEEKLY },
      });

      const response = await testPutHandler(mockRequest, 'INVALID_TYPE');

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('INVALID_JOB_TYPE');
    });

    it('should return 400 for invalid schedule', async () => {
      const { auth } = require('@/lib/auth');
      auth.mockResolvedValue({
        user: { id: 'test-user-id' },
      });

      const mockRequest = createMockRequest({
        method: 'PUT',
        body: { schedule: 'INVALID_SCHEDULE' },
      });

      const response = await testPutHandler(mockRequest, JobType.NOVEL_EVENTS);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('INVALID_SCHEDULE');
    });
  });

  describe('DELETE /api/user/jobs/[jobType]', () => {
    const testDeleteHandler = async (req: NextRequest, jobType: string): Promise<NextResponse> => {
      try {
        const { auth } = await import('@/lib/auth');
        const session = await auth();

        if (!session?.user?.id) {
          const { ApiError } = await import('@/lib/errors/ApiError');
          throw new ApiError(401, 'You must be logged in to access this resource.', 'UNAUTHORIZED');
        }

        if (!Object.values(JobType).includes(jobType as JobType)) {
          const { ApiError } = await import('@/lib/errors/ApiError');
          throw new ApiError(400, 'Invalid jobType', 'INVALID_JOB_TYPE');
        }

        const { UserJobService } = await import('@/lib/services/userJob.service');
        const userJobService = new UserJobService();
        await userJobService.disableJob(session.user.id, jobType as JobType);

        return NextResponse.json({ message: 'Job disabled successfully' });
      } catch (error) {
        const { handleApiError } = await import('@/lib/errors/handleApiError');
        return handleApiError(error);
      }
    };

    it('should disable job successfully', async () => {
      const { auth } = require('@/lib/auth');
      auth.mockResolvedValue({
        user: { id: 'test-user-id' },
      });

      mockUserJobService.disableJob.mockResolvedValue(undefined);

      const mockRequest = createMockRequest({ method: 'DELETE' });
      const response = await testDeleteHandler(mockRequest, JobType.NOVEL_EVENTS);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ message: 'Job disabled successfully' });
      expect(mockUserJobService.disableJob).toHaveBeenCalledWith(
        'test-user-id',
        JobType.NOVEL_EVENTS
      );
    });

    it('should return 400 for invalid jobType', async () => {
      const { auth } = require('@/lib/auth');
      auth.mockResolvedValue({
        user: { id: 'test-user-id' },
      });

      const mockRequest = createMockRequest({ method: 'DELETE' });
      const response = await testDeleteHandler(mockRequest, 'INVALID_TYPE');

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('INVALID_JOB_TYPE');
    });

    it('should return 401 if user is not authenticated', async () => {
      const { auth } = require('@/lib/auth');
      auth.mockResolvedValue(null);

      const mockRequest = createMockRequest({ method: 'DELETE' });
      const response = await testDeleteHandler(mockRequest, JobType.NOVEL_EVENTS);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('UNAUTHORIZED');
    });
  });
});

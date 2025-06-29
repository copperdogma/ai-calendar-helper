import { UserJobService } from '@/lib/services/userJob.service';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    userJobSchedule: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    jobFailure: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('UserJobService', () => {
  let userJobService: UserJobService;
  const mockUserId = 'test-user-id';
  const mockJobId = 'test-job-id';

  beforeEach(() => {
    userJobService = new UserJobService();
    jest.clearAllMocks();
  });

  describe('createJob', () => {
    it('should create a new user job with default settings', async () => {
      const mockJob = {
        id: mockJobId,
        userId: mockUserId,
        jobType: 'NOVEL_EVENTS',
        schedule: 'DAILY',
        enabled: true,
        nextRun: new Date('2025-01-12T09:00:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.userJobSchedule.create as any).mockResolvedValue(mockJob);

      const result = await userJobService.createJob(mockUserId, 'NOVEL_EVENTS', 'DAILY');

      expect(prisma.userJobSchedule.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          jobType: 'NOVEL_EVENTS',
          schedule: 'DAILY',
          enabled: true,
          nextRun: expect.any(Date),
        },
      });
      expect(result).toEqual(mockJob);
    });

    it('should calculate correct nextRun for different schedules', async () => {
      const mockJob = { id: mockJobId, userId: mockUserId };
      (prisma.userJobSchedule.create as any).mockResolvedValue(mockJob);

      // Test daily schedule
      await userJobService.createJob(mockUserId, 'NOVEL_EVENTS', 'DAILY');
      expect(prisma.userJobSchedule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          schedule: 'DAILY',
          nextRun: expect.any(Date),
        }),
      });

      // Test weekly schedule
      await userJobService.createJob(mockUserId, 'NOVEL_EVENTS', 'WEEKLY');
      expect(prisma.userJobSchedule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          schedule: 'WEEKLY',
          nextRun: expect.any(Date),
        }),
      });

      // Test monthly schedule
      await userJobService.createJob(mockUserId, 'NOVEL_EVENTS', 'MONTHLY');
      expect(prisma.userJobSchedule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          schedule: 'MONTHLY',
          nextRun: expect.any(Date),
        }),
      });
    });
  });

  describe('enableJob', () => {
    it('should enable a user job and update nextRun', async () => {
      const mockExistingJob = {
        id: mockJobId,
        userId: mockUserId,
        jobType: 'NOVEL_EVENTS',
        schedule: 'DAILY',
        enabled: false,
      };

      const mockUpdatedJob = {
        id: mockJobId,
        userId: mockUserId,
        enabled: true,
        nextRun: new Date('2025-01-12T09:00:00Z'),
      };

      (prisma.userJobSchedule.findUnique as any).mockResolvedValue(mockExistingJob);
      (prisma.userJobSchedule.update as any).mockResolvedValue(mockUpdatedJob);

      const result = await userJobService.enableJob(mockUserId, 'NOVEL_EVENTS');

      expect(prisma.userJobSchedule.findUnique).toHaveBeenCalledWith({
        where: {
          userId_jobType: {
            userId: mockUserId,
            jobType: 'NOVEL_EVENTS',
          },
        },
      });
      expect(prisma.userJobSchedule.update).toHaveBeenCalledWith({
        where: {
          userId_jobType: {
            userId: mockUserId,
            jobType: 'NOVEL_EVENTS',
          },
        },
        data: {
          enabled: true,
          nextRun: expect.any(Date),
        },
      });
      expect(result).toEqual(mockUpdatedJob);
    });
  });

  describe('disableJob', () => {
    it('should disable a user job', async () => {
      const mockUpdatedJob = {
        id: mockJobId,
        userId: mockUserId,
        enabled: false,
        nextRun: null,
      };

      (prisma.userJobSchedule.update as any).mockResolvedValue(mockUpdatedJob);

      const result = await userJobService.disableJob(mockUserId, 'NOVEL_EVENTS');

      expect(prisma.userJobSchedule.update).toHaveBeenCalledWith({
        where: {
          userId_jobType: {
            userId: mockUserId,
            jobType: 'NOVEL_EVENTS',
          },
        },
        data: {
          enabled: false,
          nextRun: null,
        },
      });
      expect(result).toEqual(mockUpdatedJob);
    });
  });

  describe('getJobStatus', () => {
    it('should return job status for a user', async () => {
      const mockJob = {
        id: mockJobId,
        userId: mockUserId,
        jobType: 'NOVEL_EVENTS',
        schedule: 'DAILY',
        enabled: true,
        lastRun: new Date('2025-01-11T09:00:00Z'),
        nextRun: new Date('2025-01-12T09:00:00Z'),
      };

      (prisma.userJobSchedule.findUnique as any).mockResolvedValue(mockJob);

      const result = await userJobService.getJobStatus(mockUserId, 'NOVEL_EVENTS');

      expect(prisma.userJobSchedule.findUnique).toHaveBeenCalledWith({
        where: {
          userId_jobType: {
            userId: mockUserId,
            jobType: 'NOVEL_EVENTS',
          },
        },
      });
      expect(result).toEqual(mockJob);
    });

    it('should return null if job does not exist', async () => {
      (prisma.userJobSchedule.findUnique as any).mockResolvedValue(null);

      const result = await userJobService.getJobStatus(mockUserId, 'NOVEL_EVENTS');

      expect(result).toBeNull();
    });
  });

  describe('updateLastRun', () => {
    it('should update lastRun and calculate nextRun', async () => {
      const lastRun = new Date('2025-01-11T09:00:00Z');

      const mockExistingJob = {
        id: mockJobId,
        userId: mockUserId,
        jobType: 'NOVEL_EVENTS',
        schedule: 'DAILY',
        enabled: true,
      };

      const mockUpdatedJob = {
        id: mockJobId,
        userId: mockUserId,
        lastRun,
        nextRun: new Date('2025-01-12T09:00:00Z'),
      };

      (prisma.userJobSchedule.findUnique as any).mockResolvedValue(mockExistingJob);
      (prisma.userJobSchedule.update as any).mockResolvedValue(mockUpdatedJob);

      const result = await userJobService.updateLastRun(mockUserId, 'NOVEL_EVENTS', lastRun);

      expect(prisma.userJobSchedule.findUnique).toHaveBeenCalledWith({
        where: {
          userId_jobType: {
            userId: mockUserId,
            jobType: 'NOVEL_EVENTS',
          },
        },
      });
      expect(prisma.userJobSchedule.update).toHaveBeenCalledWith({
        where: {
          userId_jobType: {
            userId: mockUserId,
            jobType: 'NOVEL_EVENTS',
          },
        },
        data: {
          lastRun,
          nextRun: expect.any(Date),
        },
      });
      expect(result).toEqual(mockUpdatedJob);
    });
  });

  describe('getJobsDueToRun', () => {
    it('should return jobs that are due to run', async () => {
      const now = new Date('2025-01-11T09:01:00Z');
      const mockJobs = [
        {
          id: 'job1',
          userId: 'user1',
          jobType: 'NOVEL_EVENTS',
          schedule: 'DAILY',
          enabled: true,
          nextRun: new Date('2025-01-11T09:00:00Z'),
        },
        {
          id: 'job2',
          userId: 'user2',
          jobType: 'NOVEL_EVENTS',
          schedule: 'WEEKLY',
          enabled: true,
          nextRun: new Date('2025-01-11T08:00:00Z'),
        },
      ];

      (prisma.userJobSchedule.findMany as any).mockResolvedValue(mockJobs);

      const result = await userJobService.getJobsDueToRun(now);

      expect(prisma.userJobSchedule.findMany).toHaveBeenCalledWith({
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
      expect(result).toEqual(mockJobs);
    });
  });

  describe('logJobFailure', () => {
    it('should log a job failure', async () => {
      const error = new Error('Test error');
      const mockFailure = {
        id: 'failure-id',
        userId: mockUserId,
        jobType: 'NOVEL_EVENTS',
        errorMessage: 'Test error',
        errorDetails: { stack: error.stack },
        failedAt: expect.any(Date),
      };

      (prisma.jobFailure.create as any).mockResolvedValue(mockFailure);

      const result = await userJobService.logJobFailure(mockUserId, 'NOVEL_EVENTS', error);

      expect(prisma.jobFailure.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          jobType: 'NOVEL_EVENTS',
          errorMessage: 'Test error',
          errorDetails: {
            message: 'Test error',
            stack: error.stack,
            name: 'Error',
          },
        },
      });
      expect(result).toEqual(mockFailure);
    });
  });

  describe('getJobFailures', () => {
    it('should return job failures for a user', async () => {
      const mockFailures = [
        {
          id: 'failure1',
          userId: mockUserId,
          jobType: 'NOVEL_EVENTS',
          errorMessage: 'Error 1',
          failedAt: new Date('2025-01-11T09:00:00Z'),
          retriedAt: null,
        },
        {
          id: 'failure2',
          userId: mockUserId,
          jobType: 'NOVEL_EVENTS',
          errorMessage: 'Error 2',
          failedAt: new Date('2025-01-10T09:00:00Z'),
          retriedAt: new Date('2025-01-10T10:00:00Z'),
        },
      ];

      (prisma.jobFailure.findMany as any).mockResolvedValue(mockFailures);

      const result = await userJobService.getJobFailures(mockUserId, 'NOVEL_EVENTS');

      expect(prisma.jobFailure.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          jobType: 'NOVEL_EVENTS',
        },
        orderBy: {
          failedAt: 'desc',
        },
      });
      expect(result).toEqual(mockFailures);
    });
  });

  describe('markFailureRetried', () => {
    it('should mark a failure as retried', async () => {
      const failureId = 'failure-id';
      const retriedBy = 'admin-user-id';
      const mockUpdatedFailure = {
        id: failureId,
        retriedAt: new Date(),
        retriedBy,
      };

      (prisma.jobFailure.update as any).mockResolvedValue(mockUpdatedFailure);

      const result = await userJobService.markFailureRetried(failureId, retriedBy);

      expect(prisma.jobFailure.update).toHaveBeenCalledWith({
        where: { id: failureId },
        data: {
          retriedAt: expect.any(Date),
          retriedBy,
        },
      });
      expect(result).toEqual(mockUpdatedFailure);
    });
  });
});

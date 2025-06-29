import { UserJobScheduler } from '@/lib/scheduler/userJobScheduler';
import { UserJobService } from '@/lib/services/userJob.service';
import * as NovelEventsService from '@/lib/novelEvents/NovelEventsService';
import * as OAuthClient from '@/lib/google/getOAuthClient';
import cron from 'node-cron';

// Mock dependencies
jest.mock('@/lib/services/userJob.service');
jest.mock('@/lib/novelEvents/NovelEventsService');
jest.mock('@/lib/google/getOAuthClient');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    // Add any specific prisma methods you need to mock here
    userJobSchedule: {},
    user: {},
  },
}));
jest.mock('node-cron');

const mockCron = cron as jest.Mocked<typeof cron>;
const mockUserJobService = UserJobService as jest.MockedClass<typeof UserJobService>;
const mockDetectNovelEvents = NovelEventsService.detectNovelEvents as jest.MockedFunction<
  typeof NovelEventsService.detectNovelEvents
>;
const mockGetUserOAuthClient = OAuthClient.getUserOAuthClient as jest.MockedFunction<
  typeof OAuthClient.getUserOAuthClient
>;

describe('UserJobScheduler', () => {
  let userJobScheduler: UserJobScheduler;
  let mockScheduledTask: any;
  let mockUserJobServiceInstance: jest.Mocked<UserJobService>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock scheduled task
    mockScheduledTask = {
      stop: jest.fn(),
      start: jest.fn(),
    };
    mockCron.schedule.mockReturnValue(mockScheduledTask);

    // Mock service instances
    mockUserJobServiceInstance = {
      getJobsDueToRun: jest.fn(),
      updateLastRun: jest.fn(),
      logJobFailure: jest.fn(),
    } as any;
    mockUserJobService.mockImplementation(() => mockUserJobServiceInstance);

    // Mock external dependencies
    mockDetectNovelEvents.mockResolvedValue([]);
    mockGetUserOAuthClient.mockResolvedValue({} as any);

    userJobScheduler = UserJobScheduler.getInstance();
  });

  afterEach(() => {
    jest.useRealTimers();
    // Reset singleton instance
    (UserJobScheduler as any)._instance = null;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = UserJobScheduler.getInstance();
      const instance2 = UserJobScheduler.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should create a new instance after reset', () => {
      const instance1 = UserJobScheduler.getInstance();
      (UserJobScheduler as any)._instance = null;
      const instance2 = UserJobScheduler.getInstance();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Scheduler Initialization', () => {
    it('should schedule a cron job on initialization', () => {
      expect(mockCron.schedule).toHaveBeenCalledWith(
        '* * * * *', // Every minute
        expect.any(Function),
        { timezone: 'UTC' }
      );
    });

    it('should stop existing scheduled task before creating new one', () => {
      // First initialization already called in beforeEach
      expect(mockCron.schedule).toHaveBeenCalledTimes(1);

      // Create another instance (simulating restart)
      const newScheduler = new (UserJobScheduler as any)();

      expect(mockScheduledTask.stop).toHaveBeenCalled();
      expect(mockCron.schedule).toHaveBeenCalledTimes(2);
    });
  });

  describe('Job Discovery and Execution', () => {
    it('should discover and execute due jobs', async () => {
      const mockJobs = [
        {
          id: 'job1',
          userId: 'user1',
          jobType: 'NOVEL_EVENTS',
          schedule: 'DAILY',
          enabled: true,
          nextRun: new Date('2025-01-11T09:00:00Z'),
          user: { id: 'user1', email: 'user1@example.com' },
        },
        {
          id: 'job2',
          userId: 'user2',
          jobType: 'NOVEL_EVENTS',
          schedule: 'WEEKLY',
          enabled: true,
          nextRun: new Date('2025-01-11T08:00:00Z'),
          user: { id: 'user2', email: 'user2@example.com' },
        },
      ];

      mockUserJobServiceInstance.getJobsDueToRun.mockResolvedValue(mockJobs);
      mockDetectNovelEvents.mockResolvedValue([]);

      // Get the cron callback function and execute it
      const cronCallback = mockCron.schedule.mock.calls[0][1];
      await cronCallback();

      expect(mockUserJobServiceInstance.getJobsDueToRun).toHaveBeenCalledWith(expect.any(Date));
      expect(mockGetUserOAuthClient).toHaveBeenCalledTimes(2);
      expect(mockGetUserOAuthClient).toHaveBeenCalledWith('user1', expect.any(Object));
      expect(mockGetUserOAuthClient).toHaveBeenCalledWith('user2', expect.any(Object));
      expect(mockDetectNovelEvents).toHaveBeenCalledTimes(2);
    });

    it('should update last run time for successful jobs', async () => {
      const mockJob = {
        id: 'job1',
        userId: 'user1',
        jobType: 'NOVEL_EVENTS',
        schedule: 'DAILY',
        enabled: true,
        nextRun: new Date('2025-01-11T09:00:00Z'),
        user: { id: 'user1', email: 'user1@example.com' },
      };

      mockUserJobServiceInstance.getJobsDueToRun.mockResolvedValue([mockJob]);
      mockDetectNovelEvents.mockResolvedValue([]);

      const cronCallback = mockCron.schedule.mock.calls[0][1];
      await cronCallback();

      expect(mockUserJobServiceInstance.updateLastRun).toHaveBeenCalledWith(
        'user1',
        'NOVEL_EVENTS',
        expect.any(Date)
      );
    });

    it('should log failures for failed jobs', async () => {
      const mockJob = {
        id: 'job1',
        userId: 'user1',
        jobType: 'NOVEL_EVENTS',
        schedule: 'DAILY',
        enabled: true,
        nextRun: new Date('2025-01-11T09:00:00Z'),
        user: { id: 'user1', email: 'user1@example.com' },
      };

      const mockError = new Error('OAuth failed');

      mockUserJobServiceInstance.getJobsDueToRun.mockResolvedValue([mockJob]);
      mockGetUserOAuthClient.mockRejectedValue(mockError);

      const cronCallback = mockCron.schedule.mock.calls[0][1];
      await cronCallback();

      expect(mockUserJobServiceInstance.logJobFailure).toHaveBeenCalledWith(
        'user1',
        'NOVEL_EVENTS',
        mockError
      );
      expect(mockUserJobServiceInstance.updateLastRun).not.toHaveBeenCalled();
    });

    it('should handle no jobs due to run', async () => {
      mockUserJobServiceInstance.getJobsDueToRun.mockResolvedValue([]);

      const cronCallback = mockCron.schedule.mock.calls[0][1];
      await cronCallback();

      expect(mockUserJobServiceInstance.getJobsDueToRun).toHaveBeenCalled();
      expect(mockGetUserOAuthClient).not.toHaveBeenCalled();
      expect(mockDetectNovelEvents).not.toHaveBeenCalled();
      expect(mockUserJobServiceInstance.updateLastRun).not.toHaveBeenCalled();
    });
  });

  describe('Job Cache Management', () => {
    it('should cache job configurations and refresh every 5 minutes', async () => {
      const mockJobs = [
        {
          id: 'job1',
          userId: 'user1',
          jobType: 'NOVEL_EVENTS',
          schedule: 'DAILY',
          enabled: true,
          nextRun: new Date('2025-01-11T09:00:00Z'),
          user: { id: 'user1', email: 'user1@example.com' },
        },
      ];

      mockUserJobServiceInstance.getJobsDueToRun.mockResolvedValue(mockJobs);

      // First call - should fetch from database
      const cronCallback = mockCron.schedule.mock.calls[0][1];
      await cronCallback();

      expect(mockUserJobServiceInstance.getJobsDueToRun).toHaveBeenCalledTimes(1);

      // Second call within cache period - should use cache
      jest.advanceTimersByTime(2 * 60 * 1000); // 2 minutes
      await cronCallback();

      // Should still only be called once due to caching
      expect(mockUserJobServiceInstance.getJobsDueToRun).toHaveBeenCalledTimes(1);

      // Third call after cache expiry - should refresh
      jest.advanceTimersByTime(4 * 60 * 1000); // 4 more minutes (6 total)
      await cronCallback();

      expect(mockUserJobServiceInstance.getJobsDueToRun).toHaveBeenCalledTimes(2);
    });
  });

  describe('Status and Management', () => {
    it('should return scheduler status information', () => {
      const status = userJobScheduler.getStatus();

      expect(status).toEqual({
        isRunning: true,
        lastCacheRefresh: expect.any(Date),
        cachedJobsCount: 0,
      });
    });

    it('should allow stopping the scheduler', () => {
      userJobScheduler.stop();

      expect(mockScheduledTask.stop).toHaveBeenCalled();

      const status = userJobScheduler.getStatus();
      expect(status.isRunning).toBe(false);
    });

    it('should allow starting the scheduler', () => {
      userJobScheduler.stop();
      userJobScheduler.start();

      expect(mockCron.schedule).toHaveBeenCalledTimes(2); // Once in beforeEach, once in start()
    });
  });

  describe('Error Handling', () => {
    it('should handle job discovery errors gracefully', async () => {
      const mockError = new Error('Database connection failed');
      mockUserJobServiceInstance.getJobsDueToRun.mockRejectedValue(mockError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const cronCallback = mockCron.schedule.mock.calls[0][1];
      await cronCallback();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[USER-JOB-SCHEDULER] Error discovering jobs:',
        mockError
      );

      consoleSpy.mockRestore();
    });

    it('should continue processing other jobs if one fails', async () => {
      const mockJobs = [
        {
          id: 'job1',
          userId: 'user1',
          jobType: 'NOVEL_EVENTS',
          schedule: 'DAILY',
          enabled: true,
          nextRun: new Date('2025-01-11T09:00:00Z'),
          user: { id: 'user1', email: 'user1@example.com' },
        },
        {
          id: 'job2',
          userId: 'user2',
          jobType: 'NOVEL_EVENTS',
          schedule: 'WEEKLY',
          enabled: true,
          nextRun: new Date('2025-01-11T08:00:00Z'),
          user: { id: 'user2', email: 'user2@example.com' },
        },
      ];

      mockUserJobServiceInstance.getJobsDueToRun.mockResolvedValue(mockJobs);
      mockGetUserOAuthClient
        .mockRejectedValueOnce(new Error('Job 1 OAuth failed'))
        .mockResolvedValueOnce({} as any);
      mockDetectNovelEvents.mockResolvedValue([]);

      const cronCallback = mockCron.schedule.mock.calls[0][1];
      await cronCallback();

      expect(mockUserJobServiceInstance.logJobFailure).toHaveBeenCalledTimes(1);
      expect(mockUserJobServiceInstance.updateLastRun).toHaveBeenCalledTimes(1);
      expect(mockUserJobServiceInstance.updateLastRun).toHaveBeenCalledWith(
        'user2',
        'NOVEL_EVENTS',
        expect.any(Date)
      );
    });
  });
});

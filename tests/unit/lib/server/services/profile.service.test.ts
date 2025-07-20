import { jest } from '@jest/globals';
import { ProfileServiceImpl } from '@/lib/server/services/profile.service';
import { prismaMock } from '../../../../../__mocks__/db/prismaMocks';
import { User } from '@prisma/client';

// Mock the logger to prevent actual logging during tests and allow assertions
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  },
}));

describe.skip('ProfileService', () => {
  let profileService: ProfileServiceImpl;

  beforeEach(() => {
    profileService = new ProfileServiceImpl(prismaMock);
  });

  describe('updateUserName', () => {
    it('should update a user name and return a success response', async () => {
      const mockUser: any = {
        id: 'user-1',
        name: 'Updated Name',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.user.update.mockResolvedValue(mockUser);

      const result = await profileService.updateUserName('user-1', 'Updated Name');

      expect(result.status).toBe('success');
      expect(result.data).toEqual(mockUser);
      expect(result.message).toBe('User name updated successfully.');
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { name: 'Updated Name' },
      });
    });

    it('should return validation error for names shorter than 3 characters', async () => {
      const result = await profileService.updateUserName('user-1', 'Ab');

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('VALIDATION_FAILED');
      expect(result.error?.message).toContain('Name must be between 3 and 50 characters');
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('should return validation error for names longer than 50 characters', async () => {
      const longName = 'A'.repeat(51);
      const result = await profileService.updateUserName('user-1', longName);

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('VALIDATION_FAILED');
      expect(result.error?.message).toContain('Name must be between 3 and 50 characters');
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('should return user not found error when user does not exist', async () => {
      const error = new Error('Record not found');
      (error as any).code = 'P2025';
      prismaMock.user.update.mockRejectedValue(error);

      const result = await profileService.updateUserName('non-existent-user', 'New Name');

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('USER_NOT_FOUND');
      expect(result.error?.message).toBe('User not found.');
      expect(result.error?.details?.originalError).toBe(error);
    });

    it('should return general error for other database errors', async () => {
      const error = new Error('Database connection error');
      prismaMock.user.update.mockRejectedValue(error);

      // Set E2E test flag to false to test error path
      const originalEnv = process.env.NEXT_PUBLIC_IS_E2E_TEST_ENV;
      process.env.NEXT_PUBLIC_IS_E2E_TEST_ENV = 'false';

      const result = await profileService.updateUserName('user-1', 'New Name');

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('DB_UPDATE_FAILED');
      expect(result.error?.message).toBe('Database connection error');
      expect(result.error?.details?.originalError).toBe(error);

      // Restore environment
      process.env.NEXT_PUBLIC_IS_E2E_TEST_ENV = originalEnv;
    });

    it('should return mock success response in E2E test environment', async () => {
      const error = new Error('Database connection error');
      prismaMock.user.update.mockRejectedValue(error);

      // Set E2E test flag to true to test mock path
      const originalEnv = process.env.NEXT_PUBLIC_IS_E2E_TEST_ENV;
      process.env.NEXT_PUBLIC_IS_E2E_TEST_ENV = 'true';

      const result = await profileService.updateUserName('user-1', 'New Name');

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      expect((result.data as User).name).toBe('New Name');
      expect(result.message).toContain('E2E test mock');

      // Restore environment
      process.env.NEXT_PUBLIC_IS_E2E_TEST_ENV = originalEnv;
    });
  });

  describe('deleteAccount', () => {
    const mockUserId = 'user-123';
    const mockUser: any = {
      id: mockUserId,
      name: 'Test User',
      email: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      // Reset call history but don't clear implementations
      // This prevents interference with transaction mocks set in individual tests
      prismaMock.user.findUnique.mockClear();
      prismaMock.user.create.mockClear();
      prismaMock.user.update.mockClear();
      prismaMock.user.delete.mockClear();
      prismaMock.$transaction.mockClear();

      // Reset logger mocks
      const { logger } = require('@/lib/logger');
      logger.info.mockClear();
      logger.warn.mockClear();
      logger.error.mockClear();
      logger.debug.mockClear();
    });

    it('should successfully delete a user account with all data', async () => {
      // Setup mocks for successful deletion
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.jobFailure.updateMany.mockResolvedValue({ count: 2 });
      prismaMock.jobFailure.deleteMany.mockResolvedValue({ count: 3 });
      prismaMock.user.delete.mockResolvedValue(mockUser);

      // Mock successful transaction
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        return await fn(prismaMock);
      });

      const result = await profileService.deleteAccount(mockUserId);

      expect(result.status).toBe('success');
      expect(result.message).toBe('Account deleted successfully');
      expect(result.data).toEqual({ userId: mockUserId, deletedAt: expect.any(Date) });

      // Verify transaction was used
      expect(prismaMock.$transaction).toHaveBeenCalled();

      // Verify JobFailure cleanup

      expect(prismaMock.jobFailure.updateMany).toHaveBeenCalledWith({
        where: { retriedBy: mockUserId },
        data: { retriedBy: null },
      });

      expect(prismaMock.jobFailure.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });

      // Verify user deletion
      expect(prismaMock.user.delete).toHaveBeenCalledWith({
        where: { id: mockUserId },
      });
    });

    it('should return error when user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await profileService.deleteAccount('non-existent-user');

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('USER_NOT_FOUND');
      expect(result.error?.message).toBe('User not found');
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('should return error when userId is invalid', async () => {
      const result = await profileService.deleteAccount('');

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('INVALID_USER_ID');
      expect(result.error?.message).toBe('Invalid user ID provided');
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it('should handle transaction failure and rollback', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      const transactionError = new Error('Transaction failed');

      // Mock user.delete to fail, which will cause transaction to fail
      prismaMock.user.delete.mockRejectedValue(transactionError);

      // Mock successful transaction execution (it will call the failing user.delete)
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        return await fn(prismaMock);
      });

      const result = await profileService.deleteAccount(mockUserId);

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('DELETION_FAILED');
      expect(result.error?.message).toBe('Failed to delete account');
      expect(result.error?.details?.originalError).toBe(transactionError);
    });

    it('should handle specific Prisma errors during deletion', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      const prismaError = new Error('Record not found');
      (prismaError as any).code = 'P2025';

      // Mock user.delete to fail with Prisma error
      prismaMock.user.delete.mockRejectedValue(prismaError);

      // Mock successful transaction execution (it will call the failing user.delete)
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        return await fn(prismaMock);
      });

      const result = await profileService.deleteAccount(mockUserId);

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('USER_NOT_FOUND');
      expect(result.error?.message).toBe('User not found');
    });

    it('should handle JobFailure cleanup errors gracefully', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      const jobFailureError = new Error('JobFailure update failed');

      // Mock JobFailure updateMany to fail
      prismaMock.jobFailure.updateMany.mockRejectedValue(jobFailureError);

      // Mock successful transaction execution (it will call the failing jobFailure.updateMany)
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        return await fn(prismaMock);
      });

      const result = await profileService.deleteAccount(mockUserId);

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('DELETION_FAILED');
      expect(result.error?.message).toBe('Failed to delete account');
    });

    it('should return mock success response in E2E test environment', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      const error = new Error('Database connection error');
      prismaMock.$transaction.mockRejectedValue(error);

      // Set E2E test flag to true
      const originalEnv = process.env.NEXT_PUBLIC_IS_E2E_TEST_ENV;
      process.env.NEXT_PUBLIC_IS_E2E_TEST_ENV = 'true';

      const result = await profileService.deleteAccount(mockUserId);

      expect(result.status).toBe('success');
      expect(result.message).toContain('E2E test mock');
      expect(result.data).toEqual({ userId: mockUserId, deletedAt: expect.any(Date) });

      // Restore environment
      process.env.NEXT_PUBLIC_IS_E2E_TEST_ENV = originalEnv;
    });

    it('should log audit trail for successful deletion', async () => {
      const { logger } = require('@/lib/logger');
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      prismaMock.jobFailure.updateMany.mockResolvedValue({ count: 1 });

      prismaMock.jobFailure.deleteMany.mockResolvedValue({ count: 2 });
      prismaMock.user.delete.mockResolvedValue(mockUser);

      // Mock successful transaction
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        return await fn(prismaMock);
      });

      await profileService.deleteAccount(mockUserId);

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ userId: mockUserId }),
        expect.stringContaining('Account deletion completed successfully')
      );
    });

    it('should log errors for failed deletion attempts', async () => {
      const { logger } = require('@/lib/logger');
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      const error = new Error('Deletion failed');
      prismaMock.$transaction.mockRejectedValue(error);

      await profileService.deleteAccount(mockUserId);

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          errorMessage: 'Deletion failed',
        }),
        expect.stringContaining('Account deletion failed')
      );
    });
  });
});

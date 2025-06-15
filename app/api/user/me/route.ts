import { NextRequest, NextResponse } from 'next/server';
import { withApiLogger } from '@/lib/services/api-logger-service';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import pino from 'pino';
import { ApiError } from '@/lib/errors/ApiError';
import { handleApiError } from '@/lib/errors/handleApiError';

/**
 * Protected User Information GET Endpoint
 *
 * Returns non-sensitive information about the currently authenticated user.
 * Requires authentication - will return 401 if not authenticated.
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

      // Fetch user details from database (excluding sensitive fields)
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          lastSignedInAt: true,
          // Explicitly NOT selecting hashedPassword
        },
      });

      // Handle case where user is not found in database
      if (!user) {
        logger.warn({ userId: session.user.id }, 'User found in session but not in database');
        throw new ApiError(404, 'User not found in database.', 'USER_NOT_FOUND');
      }

      // Return user data
      return NextResponse.json(user);
    } catch (error) {
      return handleApiError(error);
    }
  }
);

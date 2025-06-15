import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { ApiError } from './ApiError';

interface ErrorResponseBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Converts an unknown error into ApiError, captures it with Sentry, and returns a standardized NextResponse
 */
export function handleApiError(error: unknown): NextResponse<ErrorResponseBody> {
  let apiErr: ApiError;
  if (error instanceof ApiError) {
    apiErr = error;
  } else if (error instanceof Error) {
    apiErr = new ApiError(500, error.message);
  } else {
    apiErr = new ApiError(500, String(error));
  }

  // Send to Sentry (only in production or when DSN is set)
  Sentry.captureException(apiErr);

  return NextResponse.json(
    {
      success: false,
      error: {
        code: apiErr.code,
        message: apiErr.message,
      },
    },
    { status: apiErr.statusCode }
  );
}

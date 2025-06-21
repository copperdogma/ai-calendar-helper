// Replacing file with minimal analytics logging API route

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logUsageEvent, DeviceType, CalendarAction } from '@/lib/services/usage-event.service';
import { getToken } from 'next-auth/jwt';
import { ApiError } from '@/lib/errors/ApiError';
import { handleApiError } from '@/lib/errors/handleApiError';

const RequestSchema = z
  .object({
    calendarAction: z.enum(['google', 'outlook', 'ics']).nullable().optional(),
    deviceType: z.enum(['mobile', 'desktop']).optional(),
    os: z.string().optional(),
    browser: z.string().optional(),
    locale: z.string().optional(),
  })
  .passthrough(); // allow other logger fields

export async function POST(req: NextRequest) {
  try {
    let jsonBody: unknown = {};
    try {
      jsonBody = await req.json();
    } catch {
      // no body or invalid JSON – treat as empty
    }

    const parsed = RequestSchema.safeParse(jsonBody);
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.message, 'VALIDATION_ERROR');
    }

    const { calendarAction, deviceType, os, browser, locale } = parsed.data as Record<
      string,
      unknown
    >;

    // Only create analytics row if we have a deviceType or calendarAction to record
    if (deviceType || calendarAction) {
      // Resolve userId if logged in
      let userId: string | undefined;
      try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        userId = token?.sub;
      } catch {
        /* ignore */
      }

      await logUsageEvent({
        userId,
        inputType: 'text', // treat as text interaction from client side
        deviceType: (deviceType as DeviceType) ?? 'desktop',
        os: os as string | undefined,
        browser: browser as string | undefined,
        locale: locale as string | undefined,
        calendarAction: (calendarAction as CalendarAction | null) ?? null,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

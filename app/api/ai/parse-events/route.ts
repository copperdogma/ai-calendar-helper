import { NextRequest, NextResponse } from 'next/server';
import { AIProcessingService } from '@/lib/ai';
import { ExtractedEvent } from '@/types/events';
import { z } from 'zod';
import { ApiError } from '@/lib/errors/ApiError';
import { handleApiError } from '@/lib/errors/handleApiError';
import { getToken } from 'next-auth/jwt';
import { incrementUsage } from '@/lib/services/usage.service';
import { logUsageEvent } from '@/lib/services/usage-event.service';
import { jwtDecrypt } from 'jose';

/**
 * Request body schema for parsing calendar events
 */
const RequestSchema = z.object({
  text: z.string().min(1, 'Event text cannot be empty'),
  options: z
    .object({
      timezone: z.string().optional(),
      currentDate: z.string().optional(),
      userPreferences: z
        .object({
          defaultDuration: z.number().optional(),
        })
        .optional(),
    })
    .optional(),
});

// Types for request/response validation
export type ParseEventsRequest = z.infer<typeof RequestSchema>;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Validate and coerce incoming JSON request */
function validateRequest(data: unknown): ParseEventsRequest {
  const parsed = RequestSchema.safeParse(data);
  if (!parsed.success) {
    // Throw a validation ApiError so it propagates to the handler
    throw new ApiError(400, parsed.error.message, 'VALIDATION_ERROR');
  }
  // Additional check: ensure the text is not just whitespace after trimming
  if (parsed.data.text.trim().length === 0) {
    throw new ApiError(400, 'Event text cannot be empty', 'VALIDATION_ERROR');
  }
  return parsed.data;
}

/** Convert the optional request options into the format expected by AI lib */
function toAIOptions(opts: ParseEventsRequest['options'] | undefined) {
  return {
    timezone: opts?.timezone || 'UTC',
    currentDate: opts?.currentDate ? new Date(opts.currentDate) : new Date(),
    userPreferences: opts?.userPreferences,
  } as const;
}

type RawEvent = {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  timezone: string;
  summary?: string;
  confidence?: number | { overall?: number };
  originalText?: string;
};

function transformEvents(events: RawEvent[]): ExtractedEvent[] {
  const getConfidence = (conf: RawEvent['confidence']): number => {
    if (typeof conf === 'number') return conf;
    if (conf && typeof conf === 'object' && 'overall' in conf) {
      return conf.overall ?? 1;
    }
    return 1;
  };

  return events.map(ev => ({
    title: ev.title,
    description: ev.description ?? '',
    startDate: ev.startDate.toISOString(),
    endDate: ev.endDate.toISOString(),
    location: ev.location,
    timezone: ev.timezone,
    summary: ev.summary ?? '',
    confidence: getConfidence(ev.confidence),
    ...(ev.originalText ? { originalText: ev.originalText.trim() } : {}),
  }));
}

/** Determine whether debug output should be included in the response */
function shouldIncludeDebug() {
  return process.env.NODE_ENV !== 'production';
}

// -------------------------
// Helper to resolve userId
// -------------------------
let analyticsUserId: string | undefined;
const resolveUserId = async (request: NextRequest): Promise<string | undefined> => {
  if (analyticsUserId) return analyticsUserId;

  try {
    const tok = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (tok?.sub) return tok.sub as string;
  } catch {
    /* ignore */
  }

  // Fallback – decrypt session cookie (NextAuth encrypts with the same secret)
  try {
    const cookie = request.cookies.get('next-auth.session-token')?.value;
    if (cookie && process.env.NEXTAUTH_SECRET) {
      const crypto = await import('crypto');
      const derived = crypto.pbkdf2Sync(
        process.env.NEXTAUTH_SECRET,
        'NextAuth.js Generated Encryption Key',
        100000,
        32,
        'sha256'
      );
      const key = Buffer.concat([derived, derived]); // 64 bytes

      const { payload } = await jwtDecrypt(cookie, key);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (payload as any)?.sub as string | undefined;
    }
  } catch {
    /* ignore */
  }

  // Client-provided header (trusted because request passes auth middleware)
  const headerId = request.headers.get('x-user-id');
  if (headerId) return headerId;

  return undefined;
};

export async function POST(req: NextRequest) {
  // If the client requests streaming progress via ?stream=true we will return
  // a Server-Sent Events (text/event-stream) response with status updates.
  const url = new URL(req.url);
  const wantsStream =
    url.searchParams.get('stream') === 'true' ||
    req.headers.get('accept')?.includes('text/event-stream');

  if (wantsStream) {
    // We'll build a ReadableStream to progressively send JSON payloads using
    // the SSE format: "data: {json}\n\n"
    const encoder = new TextEncoder();

    // Read and validate the body up front (must fully read before streaming)
    const requestBody = await req.json();

    const { text, options } = validateRequest(requestBody);

    // Increment usage when authenticated (streaming mode)
    try {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      if (token?.sub) {
        analyticsUserId = token.sub;
        // @ts-ignore literal enum string
        await incrementUsage({ userId: token.sub, service: 'CALENDAR_PARSER' });
      }
    } catch {
      // swallow usage-tracking errors
    }

    const aiService = new AIProcessingService();
    const aiOpts = toAIOptions(options);

    const sendEvent = (controller: ReadableStreamDefaultController, payload: unknown) => {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
    };

    const stream = new ReadableStream({
      async start(controller) {
        try {
          sendEvent(controller, { status: 'Reading input...' });

          let transformed: ExtractedEvent[] = [];
          const startTime = Date.now();

          if (
            process.env.NEXT_PUBLIC_IS_E2E_TEST_ENV === 'true' ||
            process.env.NODE_ENV === 'test'
          ) {
            // Short-circuit in E2E tests to avoid calling external AI APIs
            transformed = [
              {
                title: 'Test Event',
                description: '',
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 3600000).toISOString(),
                location: '',
                timezone: 'UTC',
                summary: '',
                confidence: 1,
              },
            ];
            sendEvent(controller, { status: 'Using mocked AI response...' });
          } else {
            // --- Direct AI extraction (no legacy segmentation) ---
            sendEvent(controller, { status: 'Extracting events...' });
            const extracted = await aiService.extractEvents(text.trim(), aiOpts);
            transformed = transformEvents(extracted as unknown as RawEvent[]);
            sendEvent(controller, {
              status: `Parsed ${transformed.length} event${transformed.length !== 1 ? 's' : ''}`,
            });
          }

          // --- Usage Analytics Logging (streaming mode) ---
          try {
            const resolvedUserId = analyticsUserId ?? (await resolveUserId(req));

            await logUsageEvent({
              userId: resolvedUserId ?? undefined,
              inputType: 'text',
              textSizeChars: text.length,
              parseTimeMs: Date.now() - startTime,
              eventsExtracted: transformed.length,
              parseSuccess: true,
              deviceType: req.headers.get('user-agent')?.includes('Mobi') ? 'mobile' : 'desktop',
              locale: req.headers.get('accept-language') || undefined,
            });
          } catch {
            /* ignore analytics errors */
          }

          sendEvent(controller, {
            status: `Completed – total ${transformed.length} event${transformed.length !== 1 ? 's' : ''}`,
            complete: true,
            events: transformed,
          });

          controller.close();
        } catch (err) {
          sendEvent(controller, {
            error: err instanceof Error ? err.message : 'Unknown error',
            complete: true,
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  }

  const requestId = Math.random().toString(36).substring(2, 15);
  console.log(`🚀 [${requestId}] AI Parse Events API called`);

  try {
    // Increment usage when authenticated for non-stream path
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (token?.sub) {
      analyticsUserId = token.sub;
      // @ts-ignore literal enum string
      await incrementUsage({ userId: token.sub, service: 'CALENDAR_PARSER' });
    }

    const requestBody = await req.json();
    console.log(`📥 [${requestId}] Request body:`, {
      textLength: requestBody.text?.length || 0,
      options: requestBody.options,
    });

    // 1. Validate
    const { text, options } = validateRequest(requestBody);
    console.log(`✅ [${requestId}] Request validated successfully`);

    // 2. Prepare AI service and options
    const aiService = new AIProcessingService();
    const aiOpts = toAIOptions(options);
    console.log(`🔧 [${requestId}] AI options prepared:`, aiOpts);

    const started = Date.now();

    // 3. Direct AI extraction (no legacy segmentation)
    console.log(`🤖 [${requestId}] Starting AI event extraction (direct)...`);
    const extracted = await aiService.extractEvents(text.trim(), aiOpts);
    const transformed = transformEvents(extracted as unknown as RawEvent[]);
    console.log(`🎯 [${requestId}] AI extraction complete: ${transformed.length} events found`);

    // 4. Transform events for the client payload
    console.log(`🔄 [${requestId}] Transforming events...`);
    const transformedEvents = transformed;
    console.log(`✨ [${requestId}] Events transformed successfully`);

    const combinedDebug = extracted.map(e => JSON.stringify(e, null, 2)).join('\n\n');

    // 5. Payload
    const processingTime = Date.now() - started;
    const payload: Record<string, unknown> = {
      success: true,
      events: transformedEvents,
      processingTimeMs: processingTime,
    };

    if (shouldIncludeDebug()) {
      payload.debug = combinedDebug;
    }

    console.log(
      `🎉 [${requestId}] Success! Returning ${transformedEvents.length} events (${processingTime}ms)`
    );
    return NextResponse.json(payload);
  } catch (error) {
    console.error(`❌ [${requestId}] AI parsing error:`, error);

    // Map known error messages to ApiError instances for consistency
    if (error instanceof Error) {
      if (error.message.includes('OPENAI_API_KEY')) {
        error = new ApiError(500, 'AI service not configured properly', 'CONFIG_ERROR');
      } else if (error.message.includes('Rate limit')) {
        error = new ApiError(
          429,
          'AI service temporarily unavailable. Please try again in a moment.',
          'RATE_LIMIT'
        );
      } else if (error.message.includes('Invalid response')) {
        error = new ApiError(
          422,
          'Could not parse the text. Please try rephrasing or providing more specific details.',
          'PARSE_ERROR'
        );
      }
    }

    // Delegate to the centralized handler
    return handleApiError(error);
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Parse Events API',
    methods: ['POST'],
    description: 'Send text to extract calendar events using AI',
    example: {
      text: 'Meeting tomorrow at 2pm',
      options: {
        timezone: 'America/New_York',
        currentDate: '2024-01-15T00:00:00Z',
      },
    },
  });
}

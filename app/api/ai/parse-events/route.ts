import { NextRequest, NextResponse } from 'next/server';
import { AIProcessingService } from '@/lib/ai';
import { ExtractedEvent } from '@/types/events';
import { z } from 'zod';
import { ApiError } from '@/lib/errors/ApiError';
import { handleApiError } from '@/lib/errors/handleApiError';

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

    const aiService = new AIProcessingService();
    const aiOpts = toAIOptions(options);

    const sendEvent = (controller: ReadableStreamDefaultController, payload: unknown) => {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
    };

    const stream = new ReadableStream({
      async start(controller) {
        try {
          sendEvent(controller, { status: 'Reading input...' });

          // --- Segmentation (identify + start_lines) ---
          sendEvent(controller, { status: 'Identifying potential events...' });
          const segments = await aiService.segmentText(text.trim(), aiOpts);
          sendEvent(controller, {
            status: `Found ${segments.length} potential event${segments.length !== 1 ? 's' : ''}...`,
          });

          // --- Extract events sequentially so we can report progress ---
          const extracted: RawEvent[] = [];

          for (let i = 0; i < segments.length; i++) {
            const chunk = segments[i];
            sendEvent(controller, {
              status: `Parsing event ${i + 1} of ${segments.length}...`,
            });

            // @ts-ignore – access private helper for chunk parsing
            const ev = await aiService.parseEventChunk(chunk, aiOpts);
            if (ev) extracted.push(ev as unknown as RawEvent);
          }

          sendEvent(controller, {
            status: `Completed – total ${extracted.length} event${extracted.length !== 1 ? 's' : ''}`,
            complete: true,
            events: transformEvents(extracted),
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

    // 3. Segmentation (always safe – throws handled by outer catch)
    console.log(`🔍 [${requestId}] Starting text segmentation...`);
    const segments = await aiService.segmentText(text.trim(), aiOpts);
    console.log(`📊 [${requestId}] Segmentation complete: ${segments.length} segments`);

    // Build segmentation debug JSON (starts array + chunkTexts)
    const startsArr = segments
      .map(c => c.startLine)
      .filter((n): n is number => typeof n === 'number');
    const chunkTextPairs = segments.map(c => ({
      id: c.id,
      text:
        typeof c.startLine === 'number' && typeof c.endLine === 'number'
          ? text
              .trim()
              .split(/\r?\n/)
              .slice(c.startLine - 1, c.endLine)
              .join('\n')
          : (c.text ?? ''),
    }));
    const segmentationDebug = JSON.stringify(
      { starts: startsArr, chunkTexts: chunkTextPairs },
      null,
      2
    );

    // 4. Extract events
    console.log(`🤖 [${requestId}] Starting AI event extraction...`);
    const events = await aiService.extractEvents(text.trim(), aiOpts);
    console.log(`🎯 [${requestId}] AI extraction complete: ${events.length} events found`);

    // 5. Transform + build debug string
    console.log(`🔄 [${requestId}] Transforming events...`);
    const transformedEvents = transformEvents(events);
    console.log(`✨ [${requestId}] Events transformed successfully`);

    const DEBUG_SEPARATOR = '\n\n--------------------------\n\n';
    const debugParts: string[] = [
      segmentationDebug,
      ...events.map(e => JSON.stringify(e, null, 2)),
    ];
    const combinedDebug = debugParts.join(DEBUG_SEPARATOR);

    // 6. Payload
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

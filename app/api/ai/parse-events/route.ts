import { NextRequest, NextResponse } from 'next/server';
import { AIProcessingService } from '@/lib/ai';
import { ExtractedEvent } from '@/types/events';
import { z } from 'zod';

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
    throw new Error(parsed.error.message);
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
  }));
}

/** Determine whether debug output should be included in the response */
function shouldIncludeDebug() {
  return process.env.NODE_ENV !== 'production';
}

export async function POST(req: NextRequest) {
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
    console.error(
      `❌ [${requestId}] Error stack:`,
      error instanceof Error ? error.stack : 'No stack trace'
    );

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('OPENAI_API_KEY')) {
        console.error(`❌ [${requestId}] OpenAI API key missing or invalid`);
        return NextResponse.json({ error: 'AI service not configured properly' }, { status: 500 });
      }

      if (error.message.includes('Rate limit')) {
        console.error(`❌ [${requestId}] Rate limit exceeded`);
        return NextResponse.json(
          { error: 'AI service temporarily unavailable. Please try again in a moment.' },
          { status: 429 }
        );
      }

      if (error.message.includes('Invalid response')) {
        console.error(`❌ [${requestId}] Invalid AI response format`);
        return NextResponse.json(
          {
            error:
              'Could not parse the text. Please try rephrasing or providing more specific details.',
          },
          { status: 422 }
        );
      }
    }

    console.error(`❌ [${requestId}] Unhandled error, returning generic 500`);
    return NextResponse.json(
      { error: 'Failed to process text. Please try again.' },
      { status: 500 }
    );
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

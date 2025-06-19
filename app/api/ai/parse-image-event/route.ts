import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AIProcessingService } from '@/lib/ai';
import { ExtractedEvent } from '@/types/events';
import { ApiError } from '@/lib/errors/ApiError';
import { handleApiError } from '@/lib/errors/handleApiError';

// Allowed MIME types and size limit (5 MB)
const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'image/heic',
]);
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Optional JSON options field schema (identical to text-based options)
 */
const OptionsSchema = z
  .object({
    timezone: z.string().optional(),
    currentDate: z.string().optional(),
    userPreferences: z
      .object({
        defaultDuration: z.number().optional(),
      })
      .optional(),
  })
  .partial();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformEvent(event: any): ExtractedEvent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getConfidence = (conf: any): number => {
    if (typeof conf === 'number') return conf;
    if (conf && typeof conf === 'object' && 'overall' in conf) {
      return conf.overall ?? 1;
    }
    return 1;
  };

  return {
    title: event.title,
    description: event.description ?? '',
    startDate: new Date(event.startDate).toISOString(),
    endDate: new Date(event.endDate).toISOString(),
    location: event.location,
    timezone: event.timezone,
    summary: event.summary ?? '',
    confidence: getConfidence(event.confidence),
  };
}

export async function POST(req: NextRequest) {
  try {
    // Feature flag to quickly disable vision parsing in low-resource/dev environments
    if (process.env.ENABLE_IMAGE_PARSING === 'false') {
      return NextResponse.json(
        {
          success: false,
          error: 'Image parsing is disabled on this environment',
        },
        { status: 503 }
      );
    }

    const start = Date.now();
    const formData = await req.formData();
    const file = formData.get('image');
    if (!(file instanceof Blob)) {
      throw new ApiError(400, 'Image file is required', 'VALIDATION_ERROR');
    }

    if (!ALLOWED_MIME.has(file.type)) {
      throw new ApiError(415, 'Unsupported image format', 'UNSUPPORTED_MEDIA');
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new ApiError(413, 'Image exceeds 5MB limit', 'PAYLOAD_TOO_LARGE');
    }

    // Parse options (optional JSON string)
    let aiOptions: Parameters<AIProcessingService['parseEventImage']>[1] | undefined;
    const optionsField = formData.get('options');
    if (typeof optionsField === 'string' && optionsField.trim()) {
      const parsed = OptionsSchema.safeParse(JSON.parse(optionsField));
      if (!parsed.success) {
        throw new ApiError(400, parsed.error.message, 'VALIDATION_ERROR');
      }
      aiOptions = {
        timezone: parsed.data.timezone,
        currentDate: parsed.data.currentDate ? new Date(parsed.data.currentDate) : undefined,
        userPreferences: parsed.data.userPreferences,
      };
    }

    // Convert Blob to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const aiService = new AIProcessingService();

    // If the form includes a free-form text field, pass it through so the model
    // can merge details from both sources.
    const additionalTextField = formData.get('text');
    if (typeof additionalTextField === 'string' && additionalTextField.trim()) {
      aiOptions = {
        ...(aiOptions ?? {}),
        additionalText: additionalTextField.trim(),
      };
    }

    const event = await aiService.parseEventImage(buffer, {
      ...aiOptions,
      imageMime: file.type,
    });
    const transformed = transformEvent(event);

    return NextResponse.json(
      {
        success: true,
        events: [transformed],
        processingTimeMs: Date.now() - start,
      },
      { status: 200 }
    );
  } catch (err) {
    return handleApiError(err);
  }
}

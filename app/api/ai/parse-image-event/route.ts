import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AIProcessingService } from '@/lib/ai';
import { ExtractedEvent } from '@/types/events';
import { ApiError } from '@/lib/errors/ApiError';
import { handleApiError } from '@/lib/errors/handleApiError';
import { logUsageEvent } from '@/lib/services/usage-event.service';
import { getToken } from 'next-auth/jwt';
import { extname } from 'path';

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

// Formats the OpenAI Vision endpoint officially supports as of 2025-06
const OPENAI_SUPPORTED_MIME = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

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

    let mimeType = file.type;
    if (!mimeType) {
      const ext = extname((file as any).name || '').toLowerCase();
      const map: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
        '.heic': 'image/heic',
        '.avif': 'image/avif',
      };
      mimeType = map[ext] || '';
    }

    if (!ALLOWED_MIME.has(mimeType)) {
      if (mimeType.startsWith('image/')) {
        console.warn('⚠️ Unlisted image MIME type accepted:', mimeType);
      } else {
        throw new ApiError(415, 'Unsupported image format', 'UNSUPPORTED_MEDIA');
      }
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

    let bufferToSend: Buffer = buffer;
    let mimeForAI = mimeType;

    // The OpenAI Responses Vision API currently supports only a handful of
    // formats.  If we encounter something else (e.g. AVIF/HEIC) we transcode
    // to PNG on the fly so the request doesn't fail.
    if (!OPENAI_SUPPORTED_MIME.has(mimeType)) {
      try {
        // Lazy-load sharp so it's only bundled on the server.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const sharp = (await import('sharp')).default as typeof import('sharp');
        bufferToSend = (await sharp(buffer).png().toBuffer()) as Buffer;
        mimeForAI = 'image/png';
        console.warn(`ℹ️ Converted unsupported image type (${mimeType}) -> PNG for OpenAI Vision`);
      } catch (err) {
        console.error('Failed to convert image to PNG:', err);
        throw new ApiError(
          415,
          'Unsupported image format and automatic conversion failed',
          'UNSUPPORTED_MEDIA'
        );
      }
    }

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

    const event = await aiService.parseEventImage(bufferToSend, {
      ...aiOptions,
      imageMime: mimeForAI,
    });
    const transformed = transformEvent(event);

    // Usage analytics logging
    try {
      const ua = req.headers.get('user-agent') || '';
      const isMobile = /Mobi|Android/i.test(ua);
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

      await logUsageEvent({
        userId: token?.sub,
        inputType: additionalTextField ? 'text+image' : 'image',
        imageSizeBytes: file.size,
        parseTimeMs: Date.now() - start,
        eventsExtracted: 1,
        parseSuccess: true,
        deviceType: isMobile ? 'mobile' : 'desktop',
        locale: req.headers.get('accept-language') || undefined,
      });
    } catch {
      /* ignore */
    }

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

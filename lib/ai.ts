/* eslint-disable @typescript-eslint/no-explicit-any */

import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { buildIdentificationMessages } from './prompts/identificationPrompt';
import { buildStartLinesMessages } from './prompts/startLinesPrompt';
import { IDENTIFY_EVENTS_FUNCTION, START_LINES_FUNCTION } from './prompts/schemas';
import { SegmentChunk } from '@/types/events';

/**
 * Interface for confidence scores on extracted event data fields
 */
export interface ConfidenceScore {
  title: number;
  description: number;
  startDate: number;
  endDate: number;
  location: number;
  timezone: number;
  overall: number;
}

/**
 * Interface for extracted event data from natural language text
 */
export interface ExtractedEventData {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
  timezone: string;
  summary: string;
  confidence: ConfidenceScore;
  isAllDay: boolean;
  recurrence: string | null;
  /**
   * The exact snippet of raw text that was used to generate this event. This is
   * useful for displaying contextual information or including in calendar
   * descriptions.  It should NOT contain the entire multi-event input text –
   * only the lines relevant to this single event.
   */
  originalText?: string;
}

/**
 * Options for AI processing context
 */
export interface AIProcessingOptions {
  timezone?: string;
  currentDate?: Date;
  userPreferences?: {
    defaultDuration?: number; // in minutes
    workingHours?: { start: string; end: string };
  };
  model?: string; // Allow model override for testing
  multiEvent?: boolean;
  originalLength?: number;
  /**
   * Optional additional natural-language text supplied by the user along with
   * an image.  The text will be included verbatim in the user prompt so the
   * model can combine clues from the flyer with any missing details the user
   * types.
   */
  additionalText?: string;
  imageMime?: string;
}

/**
 * Available AI models for calendar parsing
 */
export enum AIModel {
  GPT_4 = 'gpt-4',
  GPT_4O_MINI = 'gpt-4o-mini',
  GPT_4_1_MINI = 'gpt-4.1-mini',
}

/**
 * Model configuration with pricing and characteristics
 */
export interface ModelConfig {
  name: string;
  pricing: {
    inputPerMillion: number; // USD per million tokens
    outputPerMillion: number;
  };
  maxTokens: number;
  contextWindow: number;
  description: string;
}

/**
 * Model configurations for cost comparison
 */
export const MODEL_CONFIGS: Record<AIModel, ModelConfig> = {
  [AIModel.GPT_4]: {
    name: 'GPT-4',
    pricing: { inputPerMillion: 30.0, outputPerMillion: 60.0 },
    maxTokens: 8192,
    contextWindow: 8192,
    description: 'High accuracy, most expensive',
  },
  [AIModel.GPT_4O_MINI]: {
    name: 'GPT-4o Mini',
    pricing: { inputPerMillion: 0.15, outputPerMillion: 0.6 },
    maxTokens: 16384,
    contextWindow: 128000,
    description: 'Good balance of accuracy and cost',
  },
  [AIModel.GPT_4_1_MINI]: {
    name: 'GPT-4.1 Mini',
    pricing: { inputPerMillion: 0.4, outputPerMillion: 1.6 },
    maxTokens: 32768,
    contextWindow: 1000000,
    description: 'Better accuracy than 4o-mini, still cost-effective',
  },
};

/**
 * Interface for OpenAI client (for testing)
 */
export interface OpenAIClient {
  chat: {
    completions: {
      create: (params: any) => Promise<any>;
    };
  };
}

/**
 * AI Processing Service for extracting structured event data from natural language
 */
export class AIProcessingService {
  private readonly maxRetries = 3;
  private readonly baseDelay = 1000; // 1 second
  private defaultModel: AIModel;

  constructor(openaiClient?: OpenAIClient, defaultModel: AIModel = AIModel.GPT_4O_MINI) {
    this.defaultModel = defaultModel;

    if (openaiClient) {
      // this.openai = openaiClient;
    } else {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is required');
      }

      // this.openai = new OpenAI({
      //   apiKey: process.env.OPENAI_API_KEY,
      // });
    }
  }

  /**
   * Extract structured event details from natural language text
   */
  async extractEventDetails(
    text: string,
    options: AIProcessingOptions = {}
  ): Promise<ExtractedEventData> {
    try {
      // Sanitize input
      const sanitizedText = this.sanitizeInput(text);

      // Determine model to use
      const model = options.model || this.defaultModel;

      // Build the system prompt (simplified for JSON-only output)
      const systemPrompt = this.buildSystemPrompt(options);

      // Process with retry logic
      const response = await this.processWithRetry(systemPrompt, sanitizedText, model);

      // Parse and validate response
      const eventData = this.parseResponse(response);

      // Convert string dates to Date objects
      return this.validateAndEnhanceData(eventData);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`AI processing failed: ${error.message}`);
      }
      throw new Error('AI processing failed: Unknown error');
    }
  }

  /**
   * Get cost estimate for a request
   */
  estimateCost(
    inputTokens: number,
    outputTokens: number,
    model: AIModel = this.defaultModel
  ): number {
    const config = MODEL_CONFIGS[model];
    const inputCost = (inputTokens / 1000000) * config.pricing.inputPerMillion;
    const outputCost = (outputTokens / 1000000) * config.pricing.outputPerMillion;
    return inputCost + outputCost;
  }

  /**
   * Sanitize user input to prevent injection attacks
   */
  private sanitizeInput(text: string): string {
    // Remove potentially harmful patterns
    return text
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/vbscript:/gi, '')
      .trim();
  }

  /**
   * Build simplified system prompt optimized for JSON-only output
   */
  private buildSystemPrompt(options: AIProcessingOptions): string {
    const multi = options.multiEvent;
    const currentDate = options.currentDate || new Date();
    const userTimezone = options.timezone || 'UTC';
    const defaultDuration = options.userPreferences?.defaultDuration || 60;

    return `You are an expert calendar event extraction AI. Extract structured event information from natural language text and return it as JSON.

Current context:
- Current date/time: ${currentDate.toISOString()}
- User timezone: ${userTimezone}
- Default meeting duration: ${defaultDuration} minutes

Return JSON ${multi ? 'with an "events" array where each item is' : 'with'} event data and confidence scores (0.0 to 1.0 for each field):

${multi ? '{ "events": [ { ...event } ] }' : '{ ...event }'}

Rules:
- Return dates with proper timezone offset for ${userTimezone}, NOT UTC
- Parse "4pm" as 16:00 in ${userTimezone}
- Add ${defaultDuration} minutes if no end time specified
- Use conservative confidence scores for ambiguous data
- Return null for recurrence if no pattern mentioned
- summary must be ≤20 words, descriptive but concise
${multi ? '- If more than 10 events are found, include only the 10 most salient events.\n' : ''}- Calculate relative dates from current time in ${userTimezone}`;
  }

  /**
   * Process OpenAI request with retry logic and JSON response format enforcement
   */
  private async processWithRetry(
    systemPrompt: string,
    userText: string,
    model: string
  ): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await (
          await import('./openaiResponse')
        ).createResponse<{
          output_text: string;
        }>({
          model,
          text: { format: { type: 'json_object' } },
          input: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userText },
          ],
        });

        const content = (response as any).output_text as string | undefined;
        if (!content) {
          throw new Error('Empty response from OpenAI');
        }

        if (process.env.NODE_ENV !== 'test') {
          console.log(
            '[DEBUG] Raw OpenAI output_text (truncated):',
            typeof content === 'string' ? content.slice(0, 500) : content
          );
          if (!(response as any).output_text) {
            console.log('[DEBUG] Full OpenAI response object:', JSON.stringify(response, null, 2));
          }
        }

        return content;
      } catch (error) {
        lastError = error as Error;

        // Check if it's a rate limit error (429) or server error (5xx)
        const isRetryableError = this.isRetryableError(error);

        if (!isRetryableError || attempt === this.maxRetries - 1) {
          throw lastError;
        }

        // Exponential backoff
        const delay = this.baseDelay * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Check if error is retryable (rate limits, server errors)
   */
  private isRetryableError(error: unknown): boolean {
    const apiError = error as { status?: number };
    if (apiError.status === 429) return true; // Rate limit
    if (apiError.status && apiError.status >= 500) return true; // Server errors
    return false;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Parse and validate OpenAI response (simplified for JSON-only)
   */
  private parseResponse(response: string): unknown {
    try {
      const parsed = JSON.parse(response);

      // Basic validation
      if (!parsed.title || !parsed.startDate || !parsed.confidence) {
        throw new Error('Invalid response structure');
      }

      return parsed;
    } catch {
      throw new Error('Invalid response format from AI service');
    }
  }

  /**
   * Validate and enhance extracted data
   */
  private validateAndEnhanceData(data: unknown): ExtractedEventData {
    const eventData = data as Record<string, unknown>;

    // Fallback key mapping for models that return shorter keys
    if (!eventData.title && typeof eventData.summary === 'string') {
      eventData.title = eventData.summary;
    }
    if (!eventData.startDate && eventData.start) {
      eventData.startDate = eventData.start;
    }
    if (!eventData.endDate && eventData.end) {
      eventData.endDate = eventData.end;
    }

    // Convert string dates to Date objects
    const startDate = new Date(eventData.startDate as string);
    const endDate = new Date(eventData.endDate as string);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Invalid date format in extracted data');
    }

    // Ensure end date is after start date
    if (endDate <= startDate) {
      throw new Error('End date must be after start date');
    }

    let confidence: ConfidenceScore;
    if (typeof eventData.confidence === 'number') {
      const score = eventData.confidence as number;
      if (score < 0 || score > 1) {
        throw new Error('Invalid confidence score: must be between 0 and 1');
      }
      confidence = {
        title: score,
        description: score,
        startDate: score,
        endDate: score,
        location: score,
        timezone: score,
        overall: score,
      };
    } else if (typeof eventData.confidence === 'object' && eventData.confidence) {
      const confObj = eventData.confidence as ConfidenceScore;
      // Validate each confidence score
      const fields = [
        'title',
        'description',
        'startDate',
        'endDate',
        'location',
        'timezone',
        'overall',
      ] as const;
      for (const field of fields) {
        const score = confObj[field];
        if (typeof score === 'number' && (score < 0 || score > 1)) {
          throw new Error(`Invalid confidence score for ${field}`);
        }
      }
      confidence = confObj;
    } else {
      confidence = {
        title: 0.5,
        description: 0.5,
        startDate: 0.5,
        endDate: 0.5,
        location: 0.5,
        timezone: 0.5,
        overall: 0.5,
      };
    }

    return {
      title: (eventData.title as string) || '',
      description: (eventData.description as string) || '',
      startDate,
      endDate,
      location: (eventData.location as string) || '',
      timezone: (eventData.timezone as string) || 'UTC',
      summary: (eventData.summary as string) || '',
      confidence,
      isAllDay: Boolean(eventData.isAllDay),
      recurrence: (eventData.recurrence as string) || null,
    };
  }

  /* -------------------------------- Segmentation ------------------------------ */
  // Legacy prompt retained in `SEGMENTATION_PROMPT`, but the new multi-stage
  // pipeline no longer calls it directly.

  /**
   * Public wrapper for segmenting raw text into line-number chunks.
   * NOTE: Previously this method was private and accessed reflectively by the
   * API route.  It is now part of the public surface so that callers can use
   * it directly without TypeScript hacks.
   */
  public async segmentText(
    text: string,
    options: AIProcessingOptions = {}
  ): Promise<SegmentChunk[]> {
    const rawLines = text.trim().split(/\r?\n/);
    if (rawLines.length === 0) {
      return [];
    }

    // ---------- Stage 1: Identify events (no line numbers) ----------
    const idParsed = (await this.callFunctionWithRetry(
      buildIdentificationMessages(text),
      IDENTIFY_EVENTS_FUNCTION,
      'identify_events',
      options.model || this.defaultModel
    )) as { events?: { summary: string }[] };

    const eventsArray: { summary: string }[] = Array.isArray(idParsed.events)
      ? idParsed.events
      : [];

    // Fast path: zero or one event → treat as single chunk starting at 1
    if (eventsArray.length <= 1) {
      return [
        {
          id: '0',
          text: text.trim(),
          startLine: 1,
          endLine: rawLines.length,
        },
      ];
    }

    // ---------- Stage 2: Choose start line numbers ----------
    const enumerated = rawLines.map((l, i) => `${i + 1}: ${l}`).join('\n');
    const startPrompt = buildStartLinesMessages(enumerated, eventsArray);

    const startsParsed = (await this.callFunctionWithRetry(
      startPrompt,
      START_LINES_FUNCTION,
      'start_lines',
      options.model || this.defaultModel
    )) as { starts?: number[] };

    const rawStarts = ((startsParsed as { starts: number[] }).starts || [])
      .filter((n: number) => typeof n === 'number' && n >= 1 && n <= rawLines.length)
      .map((num: number) => Math.floor(num));

    if (rawStarts.length !== eventsArray.length) {
      // Fallback: if mismatch, default to header line 1 then evenly split? For now default to old logic
      rawStarts.push(1);
    }

    const uniqueSorted: number[] = Array.from(new Set(rawStarts)).sort(
      (a: number, b: number) => a - b
    );
    const indices: number[] = [...uniqueSorted, rawLines.length + 1];

    const chunks: SegmentChunk[] = uniqueSorted.map((lineStart: number, idx: number) => {
      const nextStart: number = indices[idx + 1] as number;
      const slice = rawLines.slice(lineStart - 1, nextStart - 1).join('\n');
      return {
        id: String(idx),
        text: slice,
        startLine: lineStart,
        endLine: nextStart - 1,
      };
    });

    return chunks;
  }

  /* --------------------------- Chunk event extraction -------------------------- */

  /**
   * Extract multiple events (up to 10) from natural language text
   */
  async extractEvents(
    text: string,
    options: AIProcessingOptions = {}
  ): Promise<ExtractedEventData[]> {
    const systemPrompt = this.buildSystemPrompt({ ...options, multiEvent: true });

    const response = await (
      await import('./openaiResponse')
    ).createResponse<{ output_text: string }>({
      model: options.model || this.defaultModel,
      text: { format: { type: 'json_object' } },
      input: [
        {
          role: 'system',
          content: `${systemPrompt}\nReturn an array named events with up to 10 items.`,
        },
        { role: 'user', content: text.trim() },
      ],
    });

    const raw = (response as any).output_text as string | undefined;
    if (!raw) throw new Error('Empty response from OpenAI');

    if (process.env.NODE_ENV !== 'test') {
      console.log(
        '[DEBUG] extractEvents raw output_text (truncated 500):',
        typeof raw === 'string' ? raw.slice(0, 500) : raw
      );
      if (!(response as any).output_text) {
        console.log(
          '[DEBUG] extractEvents full response object:',
          JSON.stringify(response, null, 2)
        );
      }
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('Invalid JSON array from AI');
    }

    const arr = (parsed as any).events ?? parsed;
    if (!Array.isArray(arr) || arr.length === 0) {
      throw new Error('No events returned');
    }

    const validated = arr.slice(0, 10).map((ev: any) => this.validateAndEnhanceData(ev));

    return validated;
  }

  /**
   * Wrapper for using OpenAI function calling with automatic retry & JSON parsing.
   */
  private async callFunctionWithRetry(
    messages: ChatCompletionMessageParam[],
    funcDef: Record<string, unknown>,
    functionName: string,
    model: string
  ): Promise<unknown> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await (
          await import('./openaiResponse')
        ).createResponse<any>({
          model,
          // Cast to any pending upstream SDK type updates
          tools: [
            {
              type: 'function',
              name: functionName,
              ...funcDef,
            },
          ] as any,
          input: messages.map(m => ({ role: m.role, content: m.content })) as any,
          tool_choice: { type: 'function', function: { name: functionName } } as any,
          text: { format: { type: 'json_object' } },
        });

        // The Responses API returns tool calls under output array
        const toolCall = (response.output || []).find((o: any) => o.type === 'function_call');
        const argStr = toolCall?.arguments ?? toolCall?.output_text ?? response.output_text;
        if (!argStr) throw new Error('Empty tool call arguments');
        return JSON.parse(argStr);
      } catch (error) {
        lastError = error as Error;
        const isRetryable = this.isRetryableError(error);
        if (!isRetryable || attempt === this.maxRetries - 1) {
          throw lastError;
        }
        const delay = this.baseDelay * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }
    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Extract structured event details from an image (base64 string or Buffer).
   * This is an initial implementation intended for GPT-4o Vision-style models.
   *
   * The method reuses the simplified system prompt from text extraction so that
   * responses remain consistent JSON.  For now we embed the base64 directly in
   * the user message. A follow-up iteration can switch to the official
   * `image_url` chat format once the OpenAI SDK supports the type definitions
   * out of the box.
   */
  /* eslint-disable @typescript-eslint/no-explicit-any */
  async parseEventImage(
    image: string | Buffer,
    options: AIProcessingOptions = {}
  ): Promise<ExtractedEventData> {
    const base64Image = Buffer.isBuffer(image)
      ? image.toString('base64')
      : image.replace(/^data:image\/[^;]+;base64,/, '').trim();

    const mime = options.imageMime || 'image/jpeg';

    const model = options.model || this.defaultModel;
    const systemPrompt = this.buildSystemPrompt(options);

    const userMessageContent: any[] = [
      {
        type: 'input_text',
        text: 'Extract the event details from this image and return valid JSON only (no markdown). The JSON must include at minimum the keys title, description, startDate, endDate, location, timezone, summary, confidence, isAllDay, recurrence.  Put ANY additional text that appears in the invitation/ticket but is not already covered by the structured fields (e.g. seat numbers, RSVP phone, dress code, special instructions) into the description field so nothing important is lost.',
      },
      {
        type: 'input_image',
        image_url: `data:${mime};base64,${base64Image}`,
        detail: 'auto',
      },
    ];

    if (options.additionalText) {
      userMessageContent.push({
        type: 'input_text',
        text: `Additional context provided by the user: ${options.additionalText.trim()}`,
      });
    }

    const response = await (
      await import('./openaiResponse')
    ).createResponse<{
      output_text: string;
    }>({
      model,
      text: { format: { type: 'json_object' } },
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessageContent } as any,
      ],
    });

    const rawContent = (response as any).output_text as string | undefined;
    if (!rawContent) {
      throw new Error('Empty response from OpenAI');
    }

    const parsed = this.parseResponse(rawContent);
    return this.validateAndEnhanceData(parsed);
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

// Factory function for creating service instances with configurable model
export function createAIProcessingService(
  model: AIModel = AIModel.GPT_4O_MINI
): AIProcessingService {
  return new AIProcessingService(undefined, model);
}

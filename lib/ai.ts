import OpenAI from 'openai';

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: (params: any) => Promise<any>;
    };
  };
}

/**
 * AI Processing Service for extracting structured event data from natural language
 */
export class AIProcessingService {
  private openai: OpenAIClient;
  private readonly maxRetries = 3;
  private readonly baseDelay = 1000; // 1 second
  private defaultModel: AIModel;

  constructor(openaiClient?: OpenAIClient, defaultModel: AIModel = AIModel.GPT_4O_MINI) {
    this.defaultModel = defaultModel;

    if (openaiClient) {
      this.openai = openaiClient;
    } else {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is required');
      }

      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
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
    const currentDate = options.currentDate || new Date();
    const userTimezone = options.timezone || 'UTC';
    const defaultDuration = options.userPreferences?.defaultDuration || 60;

    return `You are an expert calendar event extraction AI. Extract structured event information from natural language text and return it as JSON.

Current context:
- Current date/time: ${currentDate.toISOString()}
- User timezone: ${userTimezone}
- Default meeting duration: ${defaultDuration} minutes

Return JSON with event data and confidence scores (0.0 to 1.0 for each field):

{
  "title": "Event title",
  "description": "Event description or empty string",
  "startDate": "ISO 8601 date with timezone offset for ${userTimezone}",
  "endDate": "ISO 8601 date with timezone offset for ${userTimezone}", 
  "location": "Location or empty string",
  "timezone": "IANA timezone identifier",
  "summary": "Succinct summary <= 20 words",
  "confidence": {
    "title": 0.0-1.0,
    "description": 0.0-1.0,
    "startDate": 0.0-1.0,
    "endDate": 0.0-1.0,
    "location": 0.0-1.0,
    "timezone": 0.0-1.0,
    "overall": 0.0-1.0
  },
  "isAllDay": boolean,
  "recurrence": "recurrence pattern or null"
}

Rules:
- Return dates with proper timezone offset for ${userTimezone}, NOT UTC
- Parse "4pm" as 16:00 in ${userTimezone}
- Add ${defaultDuration} minutes if no end time specified
- Use conservative confidence scores for ambiguous data
- Return null for recurrence if no pattern mentioned
- summary must be ≤20 words, descriptive but concise
- Calculate relative dates from current time in ${userTimezone}`;
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
        const response = await this.openai.chat.completions.create({
          model,
          temperature: 0.1,
          max_tokens: 1000,
          response_format: { type: 'json_object' }, // Enforce JSON output
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userText },
          ],
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('Empty response from OpenAI');
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

    // Validate confidence scores
    const confidence = eventData.confidence as ConfidenceScore;
    Object.keys(confidence).forEach(key => {
      if (
        typeof confidence[key as keyof ConfidenceScore] !== 'number' ||
        confidence[key as keyof ConfidenceScore] < 0 ||
        confidence[key as keyof ConfidenceScore] > 1
      ) {
        throw new Error(`Invalid confidence score for ${key}`);
      }
    });

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
}

// Factory function for creating service instances with configurable model
export function createAIProcessingService(
  model: AIModel = AIModel.GPT_4O_MINI
): AIProcessingService {
  return new AIProcessingService(undefined, model);
}

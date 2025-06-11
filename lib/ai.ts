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
}

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

  constructor(openaiClient?: OpenAIClient) {
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

      // Build the system prompt
      const systemPrompt = this.buildSystemPrompt(options);

      // Process with retry logic
      const response = await this.processWithRetry(systemPrompt, sanitizedText);

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
   * Build comprehensive system prompt for event extraction
   */
  private buildSystemPrompt(options: AIProcessingOptions): string {
    const currentDate = options.currentDate || new Date();
    const userTimezone = options.timezone || 'UTC';
    const defaultDuration = options.userPreferences?.defaultDuration || 60;

    return `You are an expert calendar event extraction AI. Your task is to analyze natural language text and extract structured event information.

Current context:
- Current date/time: ${currentDate.toISOString()}
- User timezone: ${userTimezone}
- Default meeting duration: ${defaultDuration} minutes

Extract the following information and provide confidence scores (0.0 to 1.0) for each field:

Required output format (JSON only, no markdown):
{
  "title": "Event title",
  "description": "Event description or empty string",
  "startDate": "ISO 8601 date string with timezone offset for ${userTimezone}",
  "endDate": "ISO 8601 date string with timezone offset for ${userTimezone}", 
  "location": "Location or empty string",
  "timezone": "IANA timezone identifier",
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

Guidelines:
- CRITICAL: Return all dates with proper timezone offset, not as UTC
- Parse "4pm" as 16:00 in ${userTimezone}
- For ${userTimezone}, use the appropriate offset (e.g., -04:00 for Eastern Daylight Time)
- Example format: "2025-06-12T16:00:00-04:00" (for Eastern) NOT "2025-06-12T20:00:00Z" (UTC)
- If no end time specified, add ${defaultDuration} minutes to start time
- Use the user's timezone (${userTimezone}) unless another is explicitly mentioned  
- Confidence scores should reflect certainty of extraction
- Overall confidence is weighted average of all fields
- For relative dates (tomorrow, next week), calculate absolute dates from current time in ${userTimezone}
- Be conservative with confidence scores for ambiguous information
- Return null for recurrence if no pattern is mentioned
- If location unclear, use empty string with low confidence
- Examples: 
  * "tomorrow at 4pm" → "2025-06-12T16:00:00-04:00" (for Eastern Daylight Time)
  * "meeting at 2pm" → "2025-06-11T14:00:00-04:00" (for Eastern Daylight Time)`;
  }

  /**
   * Process OpenAI request with retry logic and exponential backoff
   */
  private async processWithRetry(systemPrompt: string, userText: string): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4',
          temperature: 0.1,
          max_tokens: 1000,
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
   * Parse and validate OpenAI response
   */
  private parseResponse(response: string): unknown {
    try {
      // Remove potential markdown formatting
      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();

      const parsed = JSON.parse(cleanedResponse);

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
      confidence,
      isAllDay: Boolean(eventData.isAllDay),
      recurrence: (eventData.recurrence as string) || null,
    };
  }
}

// Factory function for creating service instances
export function createAIProcessingService(): AIProcessingService {
  return new AIProcessingService();
}

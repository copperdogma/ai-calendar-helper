/**
 * Event-related type definitions
 */

/**
 * Segment chunk for text processing
 */
export interface SegmentChunk {
  id: string;
  text?: string;
  startLine?: number;
  endLine?: number;
}

/**
 * Extracted event data from AI processing (DTO format for API responses)
 */
export interface ExtractedEvent {
  title: string;
  description: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  location?: string;
  timezone: string;
  summary: string;
  confidence: number;
}

/**
 * Multi-event API response format
 */
export interface MultiEventResponse {
  success: boolean;
  events: ExtractedEvent[];
  processingTimeMs?: number;
  debug?: string;
}

/**
 * Parse events request format
 */
export interface ParseEventsRequest {
  text: string;
  options?: {
    timezone?: string;
    currentDate?: string;
    userPreferences?: {
      defaultDuration?: number;
    };
  };
}

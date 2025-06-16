import { z } from 'zod';

/**
 * Shared JSON Schemas for OpenAI function-calling. These should be the single
 * source-of-truth used by both runtime code and evaluation harness YAML files
 * (via copy-paste or scripting).
 */

export const IDENTIFY_EVENTS_FUNCTION = {
  name: 'identify_events',
  description: 'Return a short summary for every distinct calendar event described in the text',
  parameters: {
    type: 'object',
    properties: {
      events: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            summary: {
              type: 'string',
              description: 'One-sentence description including the date.',
            },
          },
          required: ['summary'],
        },
      },
    },
    required: ['events'],
  },
} as const;

export const START_LINES_FUNCTION = {
  name: 'start_lines',
  description: 'Return the 1-based line numbers where each event begins in the numbered text',
  parameters: {
    type: 'object',
    properties: {
      starts: {
        type: 'array',
        items: { type: 'integer', description: '1-based line number' },
      },
    },
    required: ['starts'],
  },
} as const;

export const EXTRACT_EVENTS_FUNCTION = {
  name: 'extract_events',
  description: 'Return structured calendar event objects extracted from the provided text',
  parameters: {
    type: 'object',
    properties: {
      events: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            startDate: { type: 'string', description: 'ISO 8601 timestamp' },
            endDate: { type: 'string', description: 'ISO 8601 timestamp' },
            location: { type: 'string' },
            timezone: { type: 'string' },
            summary: { type: 'string' },
            confidence: { type: 'number' },
            recurrence: { type: ['string', 'null'] },
            isAllDay: { type: 'boolean' },
          },
          required: [
            'title',
            'description',
            'startDate',
            'endDate',
            'location',
            'timezone',
            'summary',
            'confidence',
            'recurrence',
            'isAllDay',
          ],
        },
      },
    },
    required: ['events'],
  },
} as const;

// Zod schemas (optional): can be used for runtime validation if desired
export const IdentifyEventsZ = z.object({
  events: z.array(z.object({ summary: z.string() })),
});

export const StartLinesZ = z.object({ starts: z.array(z.number()) });

export const ExtractEventsZ = z.object({
  events: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      location: z.string(),
      timezone: z.string(),
      summary: z.string(),
      confidence: z.union([z.number(), z.record(z.number())]),
      recurrence: z.union([z.string(), z.null()]),
      isAllDay: z.boolean(),
    })
  ),
});

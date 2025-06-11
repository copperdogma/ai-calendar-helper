# OpenAI Text Processing Service Usage

This document shows how to use the `AIProcessingService` to extract structured event data from natural language text.

## Basic Usage

```typescript
import { AIProcessingService } from '@/lib/ai';

// Create service instance (requires OPENAI_API_KEY environment variable)
const aiService = new AIProcessingService();

// Extract event details from natural language
const result = await aiService.extractEventDetails(
  'Meeting with the design team tomorrow at 2pm for 1 hour at the office'
);

console.log(result);
/*
{
  title: 'Meeting with Design Team',
  description: 'Team meeting',
  startDate: 2024-01-16T14:00:00.000Z,
  endDate: 2024-01-16T15:00:00.000Z,
  location: 'Office',
  timezone: 'UTC',
  confidence: {
    title: 0.95,
    description: 0.7,
    startDate: 0.9,
    endDate: 0.85,
    location: 0.8,
    timezone: 0.6,
    overall: 0.81
  },
  isAllDay: false,
  recurrence: null
}
*/
```

## Advanced Usage with Options

```typescript
import { AIProcessingService } from '@/lib/ai';

const aiService = new AIProcessingService();

// Provide context for better accuracy
const options = {
  timezone: 'America/New_York',
  currentDate: new Date('2024-01-15'),
  userPreferences: {
    defaultDuration: 30, // 30 minutes default
    workingHours: { start: '09:00', end: '17:00' },
  },
};

const result = await aiService.extractEventDetails(
  'Lunch with client next Friday at noon',
  options
);
```

## Error Handling

```typescript
import { AIProcessingService } from '@/lib/ai';

const aiService = new AIProcessingService();

try {
  const result = await aiService.extractEventDetails('Some vague text about maybe meeting');

  // Check confidence scores before using
  if (result.confidence.overall < 0.5) {
    console.warn('Low confidence result, may need user verification');
  }
} catch (error) {
  if (error.message.includes('Rate limit')) {
    // Handle rate limiting
    console.log('API rate limit hit, try again later');
  } else if (error.message.includes('Invalid response')) {
    // Handle parsing errors
    console.log('AI returned invalid data, try rephrasing');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## For Testing

```typescript
import { AIProcessingService, OpenAIClient } from '@/lib/ai';

// Create mock client for testing
const mockClient: OpenAIClient = {
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'Test Meeting',
                // ... other required fields
              }),
            },
          },
        ],
      }),
    },
  },
};

// Inject mock for testing
const aiService = new AIProcessingService(mockClient);
```

## Environment Setup

Add to your `.env.local` file:

```bash
# OpenAI Configuration
OPENAI_API_KEY="your-openai-api-key-here"
```

## Response Schema

The service returns an `ExtractedEventData` object with the following structure:

```typescript
interface ExtractedEventData {
  title: string; // Event title
  description: string; // Event description
  startDate: Date; // Start date/time
  endDate: Date; // End date/time
  location: string; // Event location
  timezone: string; // IANA timezone identifier
  confidence: {
    // Confidence scores (0.0-1.0)
    title: number;
    description: number;
    startDate: number;
    endDate: number;
    location: number;
    timezone: number;
    overall: number; // Weighted average
  };
  isAllDay: boolean; // Whether it's an all-day event
  recurrence: string | null; // Recurrence pattern if any
}
```

## Best Practices

1. **Check Confidence Scores**: Always validate `confidence.overall` before using extracted data
2. **Handle Errors**: Implement proper error handling for API failures
3. **Provide Context**: Use the options parameter to improve accuracy
4. **Rate Limiting**: The service includes retry logic, but be mindful of usage
5. **Input Validation**: The service sanitizes input, but validate on your end too

## Example Inputs

The service works well with natural language like:

- "Meeting with John tomorrow at 3pm"
- "Doctor appointment next Tuesday at 10:30am for 30 minutes"
- "Conference call with the team every Monday at 2pm"
- "Lunch at Café Roma on Friday at noon"
- "All-day workshop on machine learning next Thursday"
- "Weekly standup Mondays at 9am in the conference room"

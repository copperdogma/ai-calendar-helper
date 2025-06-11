import { NextRequest, NextResponse } from 'next/server';
import { AIProcessingService } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const { text, options } = await req.json();

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Text input is required' }, { status: 400 });
    }

    // Create AI service instance
    const aiService = new AIProcessingService();

    // Process the text with AI
    const result = await aiService.extractEventDetails(text.trim(), {
      timezone: options?.timezone || 'UTC',
      currentDate: options?.currentDate ? new Date(options.currentDate) : new Date(),
      userPreferences: options?.userPreferences,
    });

    // Transform the result to match the UI component's expected format
    const transformedResult = {
      id: '1', // For now, single event extraction
      title: result.title,
      description: result.description,
      startDate: result.startDate.toISOString(),
      endDate: result.endDate.toISOString(),
      location: result.location,
      timezone: result.timezone,
      isAllDay: result.isAllDay,
      recurrence: result.recurrence,
      confidence: result.confidence,
    };

    return NextResponse.json({
      success: true,
      event: transformedResult,
      processingTimeMs: Date.now() - Date.now(), // Will be calculated properly
    });
  } catch (error) {
    console.error('AI parsing error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('OPENAI_API_KEY')) {
        return NextResponse.json({ error: 'AI service not configured properly' }, { status: 500 });
      }

      if (error.message.includes('Rate limit')) {
        return NextResponse.json(
          { error: 'AI service temporarily unavailable. Please try again in a moment.' },
          { status: 429 }
        );
      }

      if (error.message.includes('Invalid response')) {
        return NextResponse.json(
          {
            error:
              'Could not parse the text. Please try rephrasing or providing more specific details.',
          },
          { status: 422 }
        );
      }
    }

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

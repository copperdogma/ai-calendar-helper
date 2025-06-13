'use client';

import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import TextInputForm from '@/components/calendar/TextInputForm';
import { ExtractedEvent } from '@/types/events';

// Define the interface for parsed events that matches the UI component
interface ParsedEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  duration?: string;
  location?: string;
  description?: string;
  confidence?: number;
}

export default function TestComponentPage() {
  const handleParseEvents = async (text: string): Promise<ParsedEvent[]> => {
    try {
      const response = await fetch('/api/ai/parse-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          options: {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // User's timezone
            currentDate: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 API Response data:', data);

      if (!data.success) {
        console.error('❌ API returned success=false:', data);
        throw new Error('Invalid response from AI service: success=false');
      }

      if (!data.events || !Array.isArray(data.events)) {
        console.error('❌ API missing events array:', data);
        throw new Error('Invalid response from AI service: missing events array');
      }

      if (data.events.length === 0) {
        console.warn('⚠️ API returned empty events array');
        return [];
      }

      console.log('✅ Processing', data.events.length, 'events from API');

      // Transform the AI service response to match UI component format
      return data.events.map((event: ExtractedEvent, index: number) => {
        try {
          const startDate = new Date(event.startDate);
          const endDate = new Date(event.endDate);

          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.error('❌ Invalid dates in event:', event);
            throw new Error(`Invalid dates in event ${index + 1}`);
          }

          const transformedEvent: ParsedEvent = {
            id: `event-${index}`,
            title: event.title || 'Untitled Event',
            date: startDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              timeZone: event.timezone || 'UTC',
            }),
            time: startDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
              timeZone: event.timezone || 'UTC',
            }),
            duration: `${Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))} minutes`,
            location: event.location || undefined,
            description: event.description || undefined,
            confidence: Math.round((event.confidence || 1) * 100),
          };

          return transformedEvent;
        } catch (error) {
          console.error('❌ Error processing event', index + 1, ':', error, 'Event data:', event);
          throw new Error(
            `Failed to process event ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      });
    } catch (error) {
      console.error('Error parsing events:', error);
      throw error; // Re-throw to let the UI component handle it
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          AI Calendar Helper - Live Demo
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Test the OpenAI integration! Enter natural language text and watch AI extract calendar
          events.
        </Typography>
        <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
          ✨ Now powered by real AI processing with confidence scoring!
        </Typography>
      </Box>

      <TextInputForm onParseEvents={handleParseEvents} />
    </Container>
  );
}

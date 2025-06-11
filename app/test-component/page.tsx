'use client';

import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import TextInputForm from '@/components/calendar/TextInputForm';

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

      if (!data.success || !data.event) {
        throw new Error('Invalid response from AI service');
      }

      // Transform the AI service response to match UI component format
      const event = data.event;
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);

      const transformedEvent: ParsedEvent = {
        id: event.id,
        title: event.title,
        date: startDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        time: startDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        duration: `${Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))} minutes`,
        location: event.location || undefined,
        description: event.description || undefined,
        confidence: Math.round(event.confidence.overall * 100),
      };

      return [transformedEvent]; // Return as array for compatibility
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

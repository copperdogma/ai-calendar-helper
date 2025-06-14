'use client';

import React from 'react';
import PageLayout from '@/components/layouts/PageLayout';
import TextInputForm from '@/components/calendar/TextInputForm';
import { ExtractedEvent } from '@/types/events';

// Re-use the AI event-parsing logic from the former Dashboard page so that the
// Calendar Parser page provides the same functionality.
async function parseEventsWithAi(text: string) {
  console.log('🚀 Starting AI parse request for text:', text.substring(0, 100) + '...');

  const response = await fetch('/api/ai/parse-events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      options: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        currentDate: new Date().toISOString(),
      },
    }),
  });

  console.log('📡 API Response status:', response.status, response.statusText);

  if (!response.ok) {
    const errorData = await response.json();
    console.error('❌ API Error response:', errorData);
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

  return data.events.map((event: ExtractedEvent, index: number) => {
    try {
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('❌ Invalid dates in event:', event);
        throw new Error(`Invalid dates in event ${index + 1}`);
      }

      return {
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
        summary: event.summary || undefined,
        originalText: event.originalText || undefined,
        confidence: Math.round((event.confidence || 1) * 100),
        rawResponse: data,
        debugCombined: data.debug,
      };
    } catch (error) {
      console.error('❌ Error processing event', index + 1, ':', error, 'Event data:', event);
      throw new Error(
        `Failed to process event ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  });
}

export default function CalendarParserPage() {
  return (
    <PageLayout
      title="Calendar Parser"
      subtitle="Extract events from free-form text"
      headerSx={{ mb: 1, pb: 0.5 }}
      contentSx={{ mt: 0.5 }}
      rootSx={{ pt: 1 }}
    >
      <TextInputForm onParseEvents={parseEventsWithAi} />
    </PageLayout>
  );
}

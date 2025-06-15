'use client';

import React from 'react';
import PageLayout from '@/components/layouts/PageLayout';
import TextInputForm from '@/components/calendar/TextInputForm';
import { ExtractedEvent } from '@/types/events';
import { useTimezone } from '@/lib/hooks/useTimezone';

// In-component helper to use the active timezone from context/hook
function useParseEventsWithAi() {
  const { timezone } = useTimezone();

  return React.useCallback(
    async (text: string) => {
      const response = await fetch('/api/ai/parse-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          options: {
            timezone,
            currentDate: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error('Invalid response from AI service: success=false');
      }

      if (!data.events || !Array.isArray(data.events)) {
        throw new Error('Invalid response from AI service: missing events array');
      }

      if (data.events.length === 0) {
        return [];
      }

      return data.events.map((event: ExtractedEvent, index: number) => {
        try {
          const startDate = new Date(event.startDate);
          const endDate = new Date(event.endDate);

          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
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
          throw new Error(
            `Failed to process event ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      });
    },
    [timezone]
  );
}

export default function CalendarParserPage() {
  const parseEventsWithAi = useParseEventsWithAi();

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

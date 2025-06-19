'use client';

import React from 'react';
import PageLayout from '@/components/layouts/PageLayout';
import TextInputForm, { ParsedEvent } from '@/components/calendar/TextInputForm';
import EventPreviewList from '@/components/calendar/EventPreviewList';
import { ExtractedEvent } from '@/types/events';
import { useTimezone } from '@/lib/hooks/useTimezone';
import TimezoneSelector from '@/components/ui/TimezoneSelector';
import { guessTimezone } from '@/lib/utils/calendarLinks';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezonePlugin from 'dayjs/plugin/timezone';
import { Box } from '@mui/material';

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

// In-component helper to use the active timezone from context/hook
function useParseEventsWithAi() {
  const { timezone } = useTimezone();

  return React.useCallback(
    async (text: string, onProgress?: (message: string) => void) => {
      const response = await fetch('/api/ai/parse-events?stream=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          text,
          options: {
            timezone,
            currentDate: new Date().toISOString(),
          },
        }),
      });

      // If backend supports streaming progress, we'll parse it; otherwise fall back to JSON response.

      const contentType = response.headers.get('Content-Type') || '';

      if (contentType.includes('text/event-stream')) {
        // Streaming SSE implementation
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let events: ExtractedEvent[] | null = null;
        let buffered = '';

        if (!reader) {
          throw new Error('Unable to read streaming response');
        }

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffered += decoder.decode(value, { stream: true });

          const chunks = buffered.split('\n\n');
          // Keep the last partial chunk in buffer
          buffered = chunks.pop() ?? '';

          for (const chunk of chunks) {
            const trimmed = chunk.trim();
            if (!trimmed.startsWith('data:')) continue;
            const jsonStr = trimmed.replace(/^data:\s*/, '');
            if (!jsonStr) continue;
            const payload = JSON.parse(jsonStr);

            if (payload.status && onProgress) {
              onProgress(payload.status as string);
            }

            if (payload.complete) {
              // Final payload contains events array
              events = payload.events as ExtractedEvent[];
            }
          }
        }

        if (!events) {
          throw new Error('No events returned by AI service');
        }

        return events.map((event: ExtractedEvent, index: number) => {
          try {
            const tz = guessTimezone(event.timezone, event.location);

            const startUtc = dayjs.utc(event.startDate);
            const endUtc = dayjs.utc(event.endDate);

            const offsetOriginal = event.timezone
              ? startUtc.tz(event.timezone).utcOffset()
              : startUtc.utcOffset();

            const startLocal = startUtc.add(offsetOriginal, 'minute');
            const endLocal = endUtc.add(offsetOriginal, 'minute');

            return {
              id: `event-${index}`,
              title: event.title || 'Untitled Event',
              date: startLocal.format('dddd, MMMM D, YYYY'),
              time: startLocal.format('HH:mm'),
              endTime: endLocal.format('HH:mm'),
              duration: `${Math.round(
                (endLocal.valueOf() - startLocal.valueOf()) / (1000 * 60)
              )} minutes`,
              durationMinutes: Math.round(
                (endLocal.valueOf() - startLocal.valueOf()) / (1000 * 60)
              ),
              endDateISO: endLocal.toISOString(),
              location: event.location || undefined,
              description: event.description || undefined,
              summary: event.summary || undefined,
              originalText: event.originalText || undefined,
              confidence: Math.round((event.confidence || 1) * 100),
              rawResponse: event,
              debugCombined: undefined,
              timezone: tz,
            };
          } catch (error) {
            throw new Error(
              `Failed to process event ${index + 1}: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`
            );
          }
        });
      }

      // ------------------------------
      // Fallback: non-streaming JSON
      // ------------------------------

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

      if (data.events.length === 0) return [];

      return (data.events as ExtractedEvent[]).map((event: ExtractedEvent, index: number) => {
        try {
          const tz = guessTimezone(event.timezone, event.location);

          const startUtc = dayjs.utc(event.startDate);
          const endUtc = dayjs.utc(event.endDate);

          const offsetOriginal = event.timezone
            ? startUtc.tz(event.timezone).utcOffset()
            : startUtc.utcOffset();

          const startLocal = startUtc.add(offsetOriginal, 'minute');
          const endLocal = endUtc.add(offsetOriginal, 'minute');

          return {
            id: `event-${index}`,
            title: event.title || 'Untitled Event',
            date: startLocal.format('dddd, MMMM D, YYYY'),
            time: startLocal.format('HH:mm'),
            endTime: endLocal.format('HH:mm'),
            duration: `${Math.round(
              (endLocal.valueOf() - startLocal.valueOf()) / (1000 * 60)
            )} minutes`,
            durationMinutes: Math.round((endLocal.valueOf() - startLocal.valueOf()) / (1000 * 60)),
            endDateISO: endLocal.toISOString(),
            location: event.location || undefined,
            description: event.description || undefined,
            summary: event.summary || undefined,
            originalText: event.originalText || undefined,
            confidence: Math.round((event.confidence || 1) * 100),
            rawResponse: event,
            debugCombined: undefined,
            timezone: tz,
          };
        } catch (error) {
          throw new Error(
            `Failed to process event ${index + 1}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
        }
      });
    },
    [timezone]
  );
}

export default function CalendarParserPage() {
  const parseEventsWithAi = useParseEventsWithAi();
  const [events, setEvents] = React.useState<ParsedEvent[]>([]);

  // Each parse is treated as a fresh run – clear the old previews first.
  const handleParsedEvents = React.useCallback((newEvents: ParsedEvent[]) => {
    setEvents(newEvents);
  }, []);

  return (
    <PageLayout
      title="Calendar Parser"
      subtitle="Extract events from free-form text or images"
      action={<TimezoneSelector dense />}
      headerSx={{ mb: 1, pb: 0.5 }}
      contentSx={{ mt: 0.5 }}
      rootSx={{ pt: 1 }}
    >
      <TextInputForm onParseEvents={parseEventsWithAi} onEventsParsed={handleParsedEvents} />
      {events.length > 0 && (
        <Box mt={4}>
          <EventPreviewList events={events} />
        </Box>
      )}
    </PageLayout>
  );
}

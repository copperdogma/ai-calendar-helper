'use client';

import React from 'react';
import PageLayout from '@/components/layouts/PageLayout';
import TextInputForm from '@/components/calendar/TextInputForm';
import { ExtractedEvent } from '@/types/events';
import { useTimezone } from '@/lib/hooks/useTimezone';
import TimezoneSelector from '@/components/ui/TimezoneSelector';
import { guessTimezone } from '@/lib/utils/calendarLinks';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezonePlugin from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

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
          const tz = guessTimezone(event.timezone, event.location);

          const startUtc = dayjs.utc(event.startDate);
          const endUtc = dayjs.utc(event.endDate);

          // If the AI supplied a different timezone, undo that offset so wall clock stays the same
          const offsetOriginal = event.timezone
            ? startUtc.tz(event.timezone).utcOffset()
            : startUtc.utcOffset(); // UTC offset (likely 0)

          const startLocal = startUtc.add(offsetOriginal, 'minute');
          const endLocal = endUtc.add(offsetOriginal, 'minute');

          return {
            id: `event-${index}`,
            title: event.title || 'Untitled Event',
            date: startLocal.format('dddd, MMMM D, YYYY'),
            time: startLocal.format('HH:mm'),
            endTime: endLocal.format('HH:mm'),
            duration: `${Math.round((endLocal.valueOf() - startLocal.valueOf()) / (1000 * 60))} minutes`,
            durationMinutes: Math.round((endLocal.valueOf() - startLocal.valueOf()) / (1000 * 60)),
            endDateISO: endLocal.toISOString(),
            location: event.location || undefined,
            description: event.description || undefined,
            summary: event.summary || undefined,
            originalText: event.originalText || undefined,
            confidence: Math.round((event.confidence || 1) * 100),
            rawResponse: data,
            debugCombined: data.debug,
            timezone: tz,
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
      action={<TimezoneSelector dense />}
      headerSx={{ mb: 1, pb: 0.5 }}
      contentSx={{ mt: 0.5 }}
      rootSx={{ pt: 1 }}
    >
      <TextInputForm onParseEvents={parseEventsWithAi} />
    </PageLayout>
  );
}

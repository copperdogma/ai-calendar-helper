'use client';

import React from 'react';
import PageLayout from '@/components/layouts/PageLayout';
import TextInputForm from '@/components/calendar/TextInputForm';

// Re-use the AI event-parsing logic from the former Dashboard page so that the
// Calendar Parser page provides the same functionality.
async function parseEventsWithAi(text: string) {
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

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!data.success || !data.event) {
    throw new Error('Invalid response from AI service');
  }

  const event = data.event;
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);

  return [
    {
      id: event.id,
      title: event.title,
      date: startDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: event.timezone,
      }),
      time: startDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: event.timezone,
      }),
      duration: `${Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))} minutes`,
      location: event.location || undefined,
      description: event.description || undefined,
      confidence: Math.round(event.confidence.overall * 100),
      rawResponse: data,
    },
  ];
}

export default function CalendarParserPage() {
  return (
    <PageLayout title="Calendar Parser" subtitle="Extract events from free-form text">
      <TextInputForm onParseEvents={parseEventsWithAi} />
    </PageLayout>
  );
}

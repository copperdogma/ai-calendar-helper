'use client';

import React from 'react';
import Link from 'next/link';
import {
  Stack,
  Button,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid, // Use Grid for the 3-column Quick Actions layout
} from '@mui/material';
// import { useSession } from 'next-auth/react'; // No longer needed here
import { useUserStore } from '@/lib/store/userStore'; // Import Zustand store
import PageLayout from '@/components/layouts/PageLayout';
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
  rawResponse?: unknown; // Add field for debugging
}

// --- Content Sections for Dashboard ---

const OverviewSection = () => {
  // Read name from Zustand store
  const currentName = useUserStore(state => state.name);

  // Use the name from the store, fallback to 'there'
  const userName = currentName || 'there';

  return (
    <Card sx={{ border: 'none', boxShadow: 'none', backgroundImage: 'none' }}>
      <CardHeader title="Overview" />
      <CardContent>
        <Typography variant="body1">Welcome back, {userName}!</Typography>
      </CardContent>
    </Card>
  );
};

const CalendarHelperSection = () => {
  const handleParseEvents = async (text: string): Promise<ParsedEvent[]> => {
    try {
      console.log('🔍 Sending to AI API:', {
        text,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

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
      console.log('🤖 Raw AI API Response:', data);

      if (!data.success || !data.event) {
        throw new Error('Invalid response from AI service');
      }

      // Transform the AI service response to match UI component format
      const event = data.event;

      // The AI returns UTC dates but specifies the intended timezone
      // We need to create a date object that represents the correct local time
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);

      console.log('📅 Date parsing:', {
        originalText: text,
        aiStartDate: event.startDate,
        aiEndDate: event.endDate,
        parsedStart: startDate,
        parsedEnd: endDate,
        startUTC: startDate.toISOString(),
        startInAITimezone: startDate.toLocaleString('en-US', { timeZone: event.timezone }),
        userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        aiTimezone: event.timezone,
      });

      const transformedEvent: ParsedEvent = {
        id: event.id,
        title: event.title,
        date: startDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: event.timezone, // Format date in the AI's specified timezone
        }),
        time: startDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: event.timezone, // Display time in the AI's specified timezone
        }),
        duration: `${Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))} minutes`,
        location: event.location || undefined,
        description: event.description || undefined,
        confidence: Math.round(event.confidence.overall * 100),
        rawResponse: data, // Include raw response for debugging
      };

      console.log('✅ Final transformed event:', transformedEvent);
      return [transformedEvent]; // Return as array for compatibility
    } catch (error: unknown) {
      console.error('❌ Error parsing events:', error);
      throw error; // Re-throw to let the UI component handle it
    }
  };

  return (
    <Card sx={{ border: 'none', boxShadow: 'none', backgroundImage: 'none' }}>
      <CardContent>
        <TextInputForm onParseEvents={handleParseEvents} />
      </CardContent>
    </Card>
  );
};

const QuickActionsSection = () => (
  <Card sx={{ border: 'none', boxShadow: 'none', backgroundImage: 'none' }}>
    <CardHeader title="Quick Actions" />
    <CardContent>
      <Grid container spacing={2}>
        {/* Add the View Profile button as the first item */}
        <Grid
          size={{
            xs: 12,
            sm: 4,
          }}
        >
          <Button variant="contained" color="primary" fullWidth component={Link} href="/profile">
            View Profile
          </Button>
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 4,
          }}
        >
          <Button variant="outlined" fullWidth>
            Create New Item
          </Button>
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 4,
          }}
        >
          <Button variant="outlined" fullWidth>
            View Reports
          </Button>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);

// --- Dashboard Page Component --- //
export default function DashboardPage() {
  return (
    <PageLayout title="Dashboard" subtitle="Overview of your account and quick actions">
      <Stack spacing={3}>
        <OverviewSection />
        <CalendarHelperSection />
        <QuickActionsSection />
      </Stack>
    </PageLayout>
  );
}

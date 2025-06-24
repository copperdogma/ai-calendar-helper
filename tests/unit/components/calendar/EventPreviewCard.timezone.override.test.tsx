import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventPreviewCard, { EventPreview } from '../../../../components/calendar/EventPreviewCard';
import { TimezoneContext } from '@/lib/providers/TimezoneProvider';

// Helper to wrap component with a specific TimezoneContext value
function withTimezone(children: React.ReactElement, tz = 'America/Los_Angeles') {
  return (
    <TimezoneContext.Provider value={{ timezone: tz, setTimezone: () => {} }}>
      {children}
    </TimezoneContext.Provider>
  );
}

describe('EventPreviewCard respects user-selected timezone over event.timezone', () => {
  it('generates calendar links using the provider timezone, ignoring event.timezone', () => {
    const event: EventPreview = {
      id: 'ev-provider-override',
      title: 'Conference Call',
      date: '2025-12-01',
      time: '10:00',
      location: 'Online',
      timezone: 'UTC', // Should be ignored
    };

    // User has chosen America/Los_Angeles in the timezone selector UI
    render(withTimezone(<EventPreviewCard event={event} />, 'America/Los_Angeles'));

    const googleBtn = screen.getByTestId('google-calendar-button');
    const href = (googleBtn as HTMLAnchorElement).href;

    // Expect the generated Google Calendar link to use the provider timezone (ctz param)
    expect(href).toContain('ctz=America%2FLos_Angeles');
  });
});

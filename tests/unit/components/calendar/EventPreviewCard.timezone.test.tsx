import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventPreviewCard, { EventPreview } from '../../../../components/calendar/EventPreviewCard';
import { TimezoneContext } from '@/lib/providers/TimezoneProvider';

// Helper to wrap component with a fixed TimezoneContext
function withTimezone(children: React.ReactElement, tz = 'America/Los_Angeles') {
  return (
    <TimezoneContext.Provider value={{ timezone: tz, setTimezone: () => {} }}>
      {children}
    </TimezoneContext.Provider>
  );
}

describe('EventPreviewCard timezone handling', () => {
  it('uses event.timezone when generating calendar links (overrides global)', () => {
    const event: EventPreview = {
      id: 'ev1',
      title: 'Ferry Departure to Salt Spring Island',
      date: '2025-07-02',
      time: '10:25',
      location: 'Tsawwassen, Vancouver',
      timezone: 'America/Edmonton', // MDT (UTC-6) in July
    };

    render(withTimezone(<EventPreviewCard event={event} />, 'Pacific/Honolulu'));

    const googleBtn = screen.getByTestId('google-calendar-button');
    const href = (googleBtn as HTMLAnchorElement).href;

    // 10:25 America/Vancouver => 17:25 UTC, duration defaults to 60m so end 18:25 UTC
    expect(href).toContain('dates=20250702T172500Z/20250702T182500Z');
  });
});

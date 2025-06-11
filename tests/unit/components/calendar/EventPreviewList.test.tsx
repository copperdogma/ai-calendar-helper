import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventPreviewList from '../../../../components/calendar/EventPreviewList';
import { EventPreview } from '../../../../components/calendar/EventPreviewCard';

describe('EventPreviewList', () => {
  const events: EventPreview[] = [
    {
      id: '1',
      title: 'Event One',
      date: 'Jan 1, 2025',
      time: '1:00 PM',
      location: 'Location 1',
      confidence: 90,
    },
    {
      id: '2',
      title: 'Event Two',
      date: 'Feb 2, 2025',
      time: '2:00 PM',
      location: 'Location 2',
      confidence: 85,
    },
  ];

  it('renders a card for each event', () => {
    render(<EventPreviewList events={events} />);
    expect(screen.getByText(/Event One/i)).toBeInTheDocument();
    expect(screen.getByText(/Event Two/i)).toBeInTheDocument();
  });
});

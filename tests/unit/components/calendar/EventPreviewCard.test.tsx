import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventPreviewCard, { EventPreview } from '../../../../components/calendar/EventPreviewCard';

const mockEvent: EventPreview = {
  id: '1',
  title: 'Board Game Night',
  date: 'Saturday, March 22, 2025',
  time: '5:00 PM',
  location: '123 Main St',
  description: 'Bring your favorite board game! There will be snacks.',
  inviteeCount: 5,
  confidence: 95,
};

describe('EventPreviewCard', () => {
  it('renders essential fields in view mode', () => {
    render(<EventPreviewCard event={mockEvent} />);

    expect(screen.getByText(/Board Game Night/i)).toBeInTheDocument();
    expect(screen.getByText(/Saturday, March 22, 2025/i)).toBeInTheDocument();
    expect(screen.getByText(/5:00 PM/i)).toBeInTheDocument();
    expect(screen.getByText(/123 Main St/i)).toBeInTheDocument();
    expect(screen.getByText(/Confidence: 95%/i)).toBeInTheDocument();
    expect(screen.getByText(/Bring your favorite board game!/i)).toBeInTheDocument();
  });

  it('allows quick edit of title and calls onUpdate', () => {
    const onUpdate = jest.fn();
    render(<EventPreviewCard event={mockEvent} onUpdate={onUpdate} />);

    // Switch to edit mode
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    // Change title field (use more specific selector to avoid multiple matches)
    const titleInput = screen.getByRole('textbox', { name: /title/i });
    fireEvent.change(titleInput, { target: { value: 'Updated Game Night' } });

    // Save changes
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ title: 'Updated Game Night' }));
  });
});

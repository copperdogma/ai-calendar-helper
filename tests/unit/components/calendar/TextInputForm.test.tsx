/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme } from '@/lib/theme';
import TextInputForm from '@/components/calendar/TextInputForm';

// Mock parsed event interface
interface ParsedEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  duration?: string;
  location?: string;
  description?: string;
  confidence?: number;
  rawResponse?: any;
}

// Create a wrapper component with theme
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = createAppTheme('light');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(component, { wrapper: TestWrapper });
};

describe('TextInputForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the form with all required elements', () => {
      renderWithTheme(<TextInputForm />);

      expect(screen.getByRole('heading', { name: /AI Calendar Helper/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Parse Events/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Clear/i })).toBeInTheDocument();
    });

    it('should disable Parse Events button when no text is entered', () => {
      renderWithTheme(<TextInputForm />);

      const parseButton = screen.getByRole('button', { name: /Parse Events/i });
      expect(parseButton).toBeDisabled();
    });

    it('should enable Parse Events button when text is entered', async () => {
      const user = userEvent.setup();
      renderWithTheme(<TextInputForm />);

      const textInput = screen.getByRole('textbox');
      const parseButton = screen.getByRole('button', { name: /Parse Events/i });

      await user.type(textInput, 'Meeting tomorrow at 2pm');

      expect(parseButton).toBeEnabled();
    });
  });

  describe('form interaction', () => {
    it('should clear form when Clear button is clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme(<TextInputForm />);

      const textInput = screen.getByRole('textbox');
      const clearButton = screen.getByRole('button', { name: /Clear/i });

      await user.type(textInput, 'Some text');
      expect(textInput).toHaveValue('Some text');

      await user.click(clearButton);
      expect(textInput).toHaveValue('');
    });

    it('should show error when trying to parse empty text', async () => {
      const user = userEvent.setup();
      renderWithTheme(<TextInputForm />);

      const textInput = screen.getByRole('textbox');
      const parseButton = screen.getByRole('button', { name: /Parse Events/i });

      // Type and delete text to trigger empty state
      await user.type(textInput, 'a');
      await user.clear(textInput);
      await user.click(parseButton);

      await waitFor(() => {
        expect(screen.getByText(/Please enter some text to parse/i)).toBeInTheDocument();
      });
    });
  });

  describe('with mock data (no onParseEvents prop)', () => {
    it('should display mock results when onParseEvents is not provided', async () => {
      const user = userEvent.setup();
      renderWithTheme(<TextInputForm />);

      const textInput = screen.getByRole('textbox');
      const parseButton = screen.getByRole('button', { name: /Parse Events/i });

      await user.type(textInput, 'Meeting tomorrow at 2pm');
      await user.click(parseButton);

      // Should show loading state
      expect(screen.getByRole('button', { name: /Parsing.../i })).toBeInTheDocument();

      // Wait for mock results to appear
      await waitFor(
        () => {
          expect(screen.getByText(/Found 2 events/i)).toBeInTheDocument();
          expect(screen.getByText(/Team meeting/i)).toBeInTheDocument();
          expect(screen.getByText(/Doctor appointment/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('with real AI integration', () => {
    const createMockParseEvents = (mockResponse: ParsedEvent[]): jest.Mock => {
      return jest.fn().mockResolvedValue(mockResponse);
    };

    it('should call onParseEvents and display results', async () => {
      const user = userEvent.setup();
      const mockResults: ParsedEvent[] = [
        {
          id: '1',
          title: 'Team Meeting',
          date: 'Thursday, June 12, 2025',
          time: '2:00 PM',
          duration: '60 minutes',
          location: 'Conference Room A',
          confidence: 95,
          rawResponse: { mockData: true },
        },
      ];

      const mockParseEvents = createMockParseEvents(mockResults);
      renderWithTheme(<TextInputForm onParseEvents={mockParseEvents} />);

      const textInput = screen.getByRole('textbox');
      const parseButton = screen.getByRole('button', { name: /Parse Events/i });

      await user.type(textInput, 'Team meeting tomorrow at 2pm in Conference Room A');
      await user.click(parseButton);

      // Should show loading state
      expect(screen.getByRole('button', { name: /Parsing.../i })).toBeInTheDocument();

      // Wait for AI results
      await waitFor(() => {
        expect(mockParseEvents).toHaveBeenCalledWith(
          'Team meeting tomorrow at 2pm in Conference Room A'
        );
        expect(screen.getByText(/Found 1 event/i)).toBeInTheDocument();
        expect(screen.getByText(/Team Meeting/i)).toBeInTheDocument();
        expect(screen.getByText(/Thursday, June 12, 2025 at 2:00 PM/i)).toBeInTheDocument();
        expect(screen.getByText(/Conference Room A/i)).toBeInTheDocument();
        expect(screen.getByText(/Confidence: 95%/i)).toBeInTheDocument();
      });

      // Check raw JSON debugging area
      expect(screen.getByText(/Raw AI Response \(for development\):/i)).toBeInTheDocument();
      const rawJsonField = screen.getByDisplayValue(/mockData/);
      expect(rawJsonField).toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      const user = userEvent.setup();
      const mockParseEvents = jest.fn().mockRejectedValue(new Error('API failed'));

      renderWithTheme(<TextInputForm onParseEvents={mockParseEvents} />);

      const textInput = screen.getByRole('textbox');
      const parseButton = screen.getByRole('button', { name: /Parse Events/i });

      await user.type(textInput, 'Meeting tomorrow');
      await user.click(parseButton);

      await waitFor(() => {
        expect(screen.getByText(/API failed/i)).toBeInTheDocument();
      });

      // Form should be usable again
      expect(screen.getByRole('button', { name: /Parse Events/i })).toBeEnabled();
    });

    it('should handle multiple events from AI response', async () => {
      const user = userEvent.setup();
      const mockResults: ParsedEvent[] = [
        {
          id: '1',
          title: 'Morning Meeting',
          date: 'Thursday, June 12, 2025',
          time: '9:00 AM',
          confidence: 90,
        },
        {
          id: '2',
          title: 'Lunch',
          date: 'Thursday, June 12, 2025',
          time: '12:00 PM',
          location: 'Café Roma',
          confidence: 85,
        },
      ];

      const mockParseEvents = createMockParseEvents(mockResults);
      renderWithTheme(<TextInputForm onParseEvents={mockParseEvents} />);

      const textInput = screen.getByRole('textbox');
      const parseButton = screen.getByRole('button', { name: /Parse Events/i });

      await user.type(textInput, 'Meeting at 9am then lunch at noon at Café Roma');
      await user.click(parseButton);

      await waitFor(() => {
        expect(screen.getByText(/Found 2 events/i)).toBeInTheDocument();
        expect(screen.getByText(/Morning Meeting/i)).toBeInTheDocument();
        expect(screen.getByText(/Lunch/i)).toBeInTheDocument();
        expect(screen.getByText(/Café Roma/i)).toBeInTheDocument();
      });
    });

    it('should disable form during processing', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: ParsedEvent[]) => void;
      const mockPromise = new Promise<ParsedEvent[]>(resolve => {
        resolvePromise = resolve;
      });
      const mockParseEvents = jest.fn().mockReturnValue(mockPromise);

      renderWithTheme(<TextInputForm onParseEvents={mockParseEvents} />);

      const textInput = screen.getByRole('textbox');
      const parseButton = screen.getByRole('button', { name: /Parse Events/i });
      const clearButton = screen.getByRole('button', { name: /Clear/i });

      await user.type(textInput, 'Meeting tomorrow');
      await user.click(parseButton);

      // During processing
      expect(textInput).toBeDisabled();
      expect(clearButton).toBeDisabled();
      expect(screen.getByRole('button', { name: /Parsing.../i })).toBeDisabled();

      // Resolve the promise
      resolvePromise!([
        {
          id: '1',
          title: 'Meeting',
          date: 'Tomorrow',
          confidence: 90,
        },
      ]);

      // After processing
      await waitFor(() => {
        expect(textInput).toBeEnabled();
        expect(clearButton).toBeEnabled();
        expect(screen.getByRole('button', { name: /Parse Events/i })).toBeEnabled();
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderWithTheme(<TextInputForm />);

      const textInput = screen.getByRole('textbox');
      expect(textInput).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Enter your event text')
      );

      const parseButton = screen.getByRole('button', { name: /Parse Events/i });
      expect(parseButton).toBeInTheDocument();

      const clearButton = screen.getByRole('button', { name: /Clear/i });
      expect(clearButton).toBeInTheDocument();
    });

    it('should announce results to screen readers', async () => {
      const user = userEvent.setup();
      const mockResults: ParsedEvent[] = [
        {
          id: '1',
          title: 'Meeting',
          date: 'Tomorrow',
          confidence: 90,
        },
      ];

      const mockParseEvents = jest.fn().mockResolvedValue(mockResults);
      renderWithTheme(<TextInputForm onParseEvents={mockParseEvents} />);

      const textInput = screen.getByRole('textbox');
      const parseButton = screen.getByRole('button', { name: /Parse Events/i });

      await user.type(textInput, 'Meeting tomorrow');
      await user.click(parseButton);

      await waitFor(() => {
        // Results section should be announced to screen readers
        expect(screen.getByText(/Found 1 event/i)).toBeInTheDocument();
      });
    });
  });
});

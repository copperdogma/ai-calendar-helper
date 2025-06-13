'use client';

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import EventPreviewCard from './EventPreviewCard';

interface ParsedEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  duration?: string;
  location?: string;
  description?: string;
  summary?: string;
  confidence?: number;
  rawResponse?: unknown;
  originalText?: string;
  debugCombined?: string;
}

interface TextInputFormProps {
  onParseEvents?: (text: string) => Promise<ParsedEvent[]>;
}

const TextInputForm: React.FC<TextInputFormProps> = ({ onParseEvents }) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ParsedEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugData, setDebugData] = useState<unknown>(null);

  const handleParseEvents = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text to parse');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      if (onParseEvents) {
        const parsedEvents = await onParseEvents(inputText.trim());
        const enriched = parsedEvents.map(evt => ({ ...evt, originalText: inputText.trim() }));
        setResults(enriched);

        // Use explicit typing for the debugCombined property
        interface EventWithDebug extends ParsedEvent {
          debugCombined?: string;
        }

        const firstEvent = parsedEvents[0] as EventWithDebug;
        if (firstEvent?.debugCombined) {
          setDebugData(firstEvent.debugCombined);
        } else {
          setDebugData(parsedEvents);
        }
      } else {
        // Mock response for testing UI without AI integration
        setTimeout(() => {
          const mockEvents: ParsedEvent[] = [
            {
              id: '1',
              title: 'Team meeting',
              date: 'Tomorrow',
              time: '2:00 PM',
              location: 'Conference room',
              confidence: 95,
              originalText: inputText.trim(),
            },
            {
              id: '2',
              title: 'Doctor appointment',
              date: 'Friday',
              time: '10:00 AM',
              confidence: 88,
              originalText: inputText.trim(),
            },
          ];
          setResults(mockEvents);
          setDebugData(mockEvents);
        }, 1500);
        return;
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to parse events');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setInputText('');
    setResults(null);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleParseEvents();
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto' }}>
      <form onSubmit={handleSubmit} role="form" aria-labelledby="event-parser-heading">
        <TextField
          multiline
          rows={6}
          fullWidth
          variant="outlined"
          placeholder="Enter your event text here (e.g., 'Team meeting tomorrow at 2pm in conference room A')"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              handleParseEvents();
            }
          }}
          aria-label="Enter your event text here to extract calendar events using AI"
          aria-describedby="event-input-help"
          data-testid="event-text-input"
          disabled={isLoading}
          sx={{ mb: 2 }}
        />

        <Typography
          id="event-input-help"
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mb: 2 }}
        >
          Tip: Include dates, times, locations, and attendees for best results.
          <br />
          Separate multiple events with blank lines.
        </Typography>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Tooltip title="Parse (⌘/Ctrl + Enter)">
            <span>
              <Button
                variant="contained"
                type="submit"
                disabled={isLoading || !inputText.trim()}
                startIcon={isLoading ? <CircularProgress size={20} /> : null}
                sx={{ minWidth: 160 }}
              >
                {isLoading ? 'Parsing...' : 'Parse Events ⌘↵'}
              </Button>
            </span>
          </Tooltip>
          <Button variant="outlined" onClick={handleClear} disabled={isLoading}>
            Clear
          </Button>
        </Box>

        {/* Results Section */}
        {((results && results.length > 0) || error) && (
          <Box sx={{ mt: 4 }} role="region" aria-labelledby="results-heading">
            <Typography
              variant="h3"
              component="h2"
              id="results-heading"
              sx={{ fontSize: '1.25rem', fontWeight: 600, mb: 2 }}
            >
              {error
                ? 'Error'
                : `Found ${results?.length || 0} event${(results?.length || 0) !== 1 ? 's' : ''}`}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} role="alert" aria-live="polite">
                {error}
              </Alert>
            )}

            {results && results.length > 0 && (
              <Box aria-live="polite" aria-label="Parsed events">
                {results.map((event, index) => (
                  <EventPreviewCard
                    key={event.id || index}
                    event={event}
                    onUpdate={(updated: ParsedEvent) => {
                      setResults(prev =>
                        prev ? prev.map((e, i) => (i === index ? updated : e)) : null
                      );
                    }}
                  />
                ))}
              </Box>
            )}

            {/* Raw JSON display for debugging */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Raw AI Response (for development):
              </Typography>
              <TextField
                multiline
                fullWidth
                value={
                  typeof debugData === 'string'
                    ? debugData
                    : JSON.stringify(debugData || results, null, 2)
                }
                variant="outlined"
                size="small"
                InputProps={{
                  readOnly: true,
                  sx: { fontSize: '0.8rem', fontFamily: 'monospace' },
                }}
                sx={{ backgroundColor: 'background.default', color: 'text.primary' }}
              />
            </Box>
          </Box>
        )}
      </form>
    </Box>
  );
};

export default TextInputForm;

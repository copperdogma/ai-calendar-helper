'use client';

import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, Alert, CircularProgress } from '@mui/material';

interface ParsedEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  duration?: string;
  location?: string;
  description?: string;
  confidence?: number;
  rawResponse?: unknown;
}

interface TextInputFormProps {
  onParseEvents?: (text: string) => Promise<ParsedEvent[]>;
}

const TextInputForm: React.FC<TextInputFormProps> = ({ onParseEvents }) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ParsedEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exampleText = `Team meeting tomorrow at 2pm in the conference room
Doctor appointment Friday at 10am
Birthday party Saturday at 6pm at Sarah's house`;

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
        setResults(parsedEvents);
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
            },
            {
              id: '2',
              title: 'Doctor appointment',
              date: 'Friday',
              time: '10:00 AM',
              confidence: 88,
            },
          ];
          setResults(mockEvents);
          setIsLoading(false);
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

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          AI Calendar Helper
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Paste or type your event text below and let AI extract calendar events for you.
        </Typography>

        {/* Text Input Area */}
        <TextField
          multiline
          rows={8}
          fullWidth
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder={`Enter your event text here, for example:\n\n${exampleText}`}
          variant="outlined"
          sx={{ mb: 2 }}
          disabled={isLoading}
          aria-label="Enter your event text here to extract calendar events using AI"
        />

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            onClick={handleParseEvents}
            disabled={isLoading || !inputText.trim()}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
            sx={{ minWidth: 140 }}
          >
            {isLoading ? 'Parsing...' : 'Parse Events'}
          </Button>
          <Button variant="outlined" onClick={handleClear} disabled={isLoading}>
            Clear
          </Button>
        </Box>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Results Display */}
        {results && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Found {results.length} event{results.length !== 1 ? 's' : ''}
            </Typography>

            {/* Simple results display - will be enhanced in Story 006 */}
            {results.map(event => (
              <Paper
                key={event.id}
                variant="outlined"
                sx={{ p: 2, mb: 2, backgroundColor: 'action.hover' }}
              >
                <Typography variant="h6">{event.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  📅 {event.date} {event.time && `at ${event.time}`}
                </Typography>
                {event.location && (
                  <Typography variant="body2" color="text.secondary">
                    📍 {event.location}
                  </Typography>
                )}
                {event.confidence && (
                  <Typography variant="body2" color="text.secondary">
                    ⚡ Confidence: {event.confidence}%
                  </Typography>
                )}
              </Paper>
            ))}

            {/* Raw JSON display for debugging */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Raw AI Response (for development):
              </Typography>
              <TextField
                multiline
                fullWidth
                value={JSON.stringify(results[0]?.rawResponse || results, null, 2)}
                variant="outlined"
                size="small"
                InputProps={{
                  readOnly: true,
                  sx: { fontSize: '0.8rem', fontFamily: 'monospace' },
                }}
                sx={{ backgroundColor: 'grey.50' }}
              />
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default TextInputForm;

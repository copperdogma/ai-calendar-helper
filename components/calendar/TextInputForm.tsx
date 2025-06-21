'use client';

import React, { useState, useRef, DragEvent } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Tooltip,
  IconButton,
} from '@mui/material';
import EventPreviewCard from './EventPreviewCard';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/AttachFile';
import { ExtractedEvent } from '@/types/events';

export interface ParsedEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  endTime?: string;
  duration?: string;
  location?: string;
  description?: string;
  summary?: string;
  confidence?: number;
  rawResponse?: unknown;
  originalText?: string;
  debugCombined?: string;
  timezone?: string;
}

export interface TextInputFormProps {
  onParseEvents?: (
    text: string,
    /** Optional callback used by the parser to push granular progress messages */
    onProgress?: (message: string) => void
  ) => Promise<ParsedEvent[]>;
  /**
   * When provided, parsed events will be forwarded to this callback and the
   * local preview inside TextInputForm will be suppressed (parent component
   * becomes the single source of truth).
   */
  onEventsParsed?: (events: ParsedEvent[]) => void;
}

const TextInputForm: React.FC<TextInputFormProps> = ({ onParseEvents, onEventsParsed }) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('Parsing...');
  const [results, setResults] = useState<ParsedEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugData, setDebugData] = useState<unknown>(null);
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const dragCounter = useRef(0);

  const handleParseEvents = async () => {
    if (!inputText.trim() && !attachedImage) {
      setError('Please enter some text or attach an image');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    // Step 1: Let the user know we're starting to read the input
    setLoadingMessage('Reading input...');

    // Give React a moment to paint the first status message
    await new Promise(resolve => setTimeout(resolve, 100));

    // Step 2: Inform the user we're sending the request to the AI parser
    setLoadingMessage('Parsing...');

    try {
      if (onParseEvents && !attachedImage) {
        // Text-only flow
        const parsedEvents = await onParseEvents(inputText.trim(), message => {
          // Update the UI with progress coming from the server (via SSE/stream)
          setLoadingMessage(message);
        });

        if (onEventsParsed) {
          onEventsParsed(parsedEvents);
        } else {
          setResults(parsedEvents);
        }

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
      } else if (attachedImage) {
        // Image (with optional text) flow – call the image parsing endpoint directly
        const formData = new FormData();
        formData.append('image', attachedImage);
        formData.append('text', inputText.trim());

        // Allow downstream options via onParseEvents helper (timezone, etc.)
        // For now we keep it simple and just submit raw.
        const response = await fetch('/api/ai/parse-image-event', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || `HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!data.success || !Array.isArray(data.events) || data.events.length === 0) {
          throw new Error('No events found in image');
        }

        const parsedEvents: ParsedEvent[] = data.events.map((evt: ExtractedEvent, idx: number) => ({
          id: `img-${Date.now()}-${idx}`,
          title: evt.title,
          date: evt.startDate.split('T')[0],
          time: evt.startDate.split('T')[1]?.substring(0, 5),
          endTime: evt.endDate.split('T')[1]?.substring(0, 5),
          duration: undefined,
          location: evt.location,
          description: evt.description,
          summary: evt.summary,
          confidence: Math.round((evt.confidence || 1) * 100),
          rawResponse: evt,
        }));

        if (onEventsParsed) {
          onEventsParsed(parsedEvents);
        } else {
          setResults(parsedEvents);
        }

        setAttachedImage(null); // clear after successful parse
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
      // Clear the loading message once finished so the default button label returns
      setLoadingMessage('Parsing...');
    }
  };

  const handleClear = () => {
    setInputText('');
    setResults(null);
    setError(null);
    setAttachedImage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleParseEvents();
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto' }}>
      {/* The form only wraps the input and action buttons to avoid nested form submissions within event previews */}
      <form
        onSubmit={handleSubmit}
        role="form"
        aria-labelledby="event-parser-heading"
        style={{ width: '100%' }}
        onDragEnter={e => {
          e.preventDefault();
          dragCounter.current += 1;
          setIsDragActive(true);
        }}
        onDragOver={e => {
          e.preventDefault();
          if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
        }}
        onDragLeave={e => {
          e.preventDefault();
          dragCounter.current -= 1;
          if (dragCounter.current === 0) {
            setIsDragActive(false);
          }
        }}
        onDrop={(e: DragEvent<HTMLFormElement>) => {
          e.preventDefault();
          dragCounter.current = 0;
          setIsDragActive(false);
          const file = e.dataTransfer.files?.[0];
          if (file) {
            // Basic validation (mime & size up to 5MB)
            if (!file.type.startsWith('image/')) {
              setError('Only image files are supported');
              return;
            }
            if (file.size > 5 * 1024 * 1024) {
              setError('Image exceeds 5 MB size limit');
              return;
            }
            setAttachedImage(file);
          }
        }}
      >
        <Box sx={{ position: 'relative', mb: 2 }}>
          <TextField
            multiline
            rows={6}
            fullWidth
            variant="outlined"
            placeholder="Enter your event text and/or drag an image here (e.g., 'Team meeting tomorrow at 2pm in conference room A')"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                handleParseEvents();
              }
            }}
            aria-label="Enter your event text and/or drag an image here to extract calendar events using AI"
            aria-describedby="event-input-help"
            data-testid="event-text-input"
            disabled={isLoading}
            sx={{
              opacity: isDragActive ? 0.9 : 1,
              transition: 'opacity 0.15s',
            }}
          />

          {isDragActive && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: '2px dashed',
                borderColor: 'primary.main',
                borderRadius: 1,
                backgroundColor: theme => theme.palette.primary.main + 'E6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                color: 'common.white',
              }}
            >
              <Typography variant="h6">Drop to attach image</Typography>
            </Box>
          )}
        </Box>

        {/* Attached image preview */}
        {attachedImage && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 2,
              p: 1,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              position: 'relative',
              width: 200,
            }}
          >
            <img
              src={URL.createObjectURL(attachedImage)}
              alt={attachedImage.name}
              style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 4 }}
            />
            <Typography variant="body2" noWrap maxWidth={100}>
              {attachedImage.name}
            </Typography>
            <IconButton
              size="small"
              sx={{ position: 'absolute', top: 0, right: 0 }}
              aria-label="Remove image"
              onClick={() => setAttachedImage(null)}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        {/* Hidden file input & attach button */}
        <input
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) setAttachedImage(file);
          }}
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

        {/* Action Buttons & attach */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Tooltip title="Attach image (⌘/Ctrl + U)">
            <span>
              <IconButton
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                aria-label="Attach image"
              >
                <UploadFileIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Parse (⌘/Ctrl + Enter)">
            <span>
              <Button
                variant="contained"
                type="submit"
                disabled={isLoading || (!inputText.trim() && !attachedImage)}
                startIcon={isLoading ? <CircularProgress size={20} /> : null}
                sx={{ minWidth: 160 }}
              >
                {isLoading ? loadingMessage : 'Parse Events ⌘↵'}
              </Button>
            </span>
          </Tooltip>
          <Button variant="outlined" onClick={handleClear} disabled={isLoading}>
            Clear
          </Button>
        </Box>
      </form>

      {/* Results Section - placed outside the form to prevent Enter key in edits from re-triggering form submit */}
      {!onEventsParsed && ((results && results.length > 0) || error || !!debugData) && (
        <Box sx={{ mt: 4 }} role="region" aria-labelledby="results-heading">
          {(error || (results && results.length > 0)) && (
            <Typography
              variant="h3"
              component="h2"
              id="results-heading"
              sx={{ fontSize: '1.25rem', fontWeight: 600, mb: 2 }}
            >
              {error
                ? 'Error'
                : `Found ${results!.length} event${results!.length !== 1 ? 's' : ''}`}
            </Typography>
          )}

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
    </Box>
  );
};

export default TextInputForm;

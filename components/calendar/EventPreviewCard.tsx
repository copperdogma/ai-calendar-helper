import React from 'react';
import { Paper, TextField, Typography, Box, IconButton, Tooltip } from '@mui/material';
import { Check, Close, Edit } from '@mui/icons-material';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { generateAddToCalendarLinks, buildEventDescription } from '@/lib/utils/calendarLinks';
// Vendor-specific icons from react-icons
import GoogleCalendarIcon from '@/components/icons/GoogleCalendarIcon';
import AppleCalendarIcon from '@/components/icons/AppleCalendarIcon';
import OutlookIcon from '@/components/icons/OutlookIcon';

export interface EventPreview {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  inviteeCount?: number;
  confidence?: number;
  summary?: string;
  originalText?: string;
}

interface EventPreviewCardProps {
  event: EventPreview;
  onUpdate?: (event: EventPreview) => void;
}

const EventPreviewCard: React.FC<EventPreviewCardProps> = ({ event, onUpdate }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState<EventPreview>(event);
  const titleInputRef = React.useRef<HTMLInputElement>(null);

  const handleFieldChange =
    (field: keyof EventPreview) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setDraft(prev => ({ ...prev, [field]: e.target.value }));
    };

  const handleDateChange = (value: dayjs.Dayjs | null) => {
    if (value) {
      setDraft(prev => ({
        ...prev,
        date: value.format('YYYY-MM-DD'),
        time: value.format('HH:mm'),
      }));
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    if (onUpdate) {
      onUpdate(draft);
    }
  };

  const handleCancel = () => {
    setDraft(event);
    setIsEditing(false);
  };

  // Keyboard shortcuts (ESC cancel, Enter save)
  const handleGlobalKey = React.useCallback(
    (e: KeyboardEvent) => {
      if (!isEditing) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    },
    [isEditing, draft]
  );

  React.useEffect(() => {
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [handleGlobalKey]);

  const handleLocalKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  // Focus title field when entering edit mode and place caret at end
  React.useEffect(() => {
    if (isEditing && titleInputRef.current) {
      const input = titleInputRef.current;
      input.focus();
      const len = input.value.length;
      input.setSelectionRange(len, len);
    }
  }, [isEditing]);

  return (
    <Paper
      sx={{ p: 2, mb: 2, position: 'relative' }}
      aria-label="event-preview-card"
      onKeyDown={handleLocalKey}
    >
      {isEditing ? (
        <>
          {/* Cancel button in upper-right */}
          <IconButton
            aria-label="cancel"
            onClick={handleCancel}
            size="small"
            sx={{ position: 'absolute', top: 8, right: 8 }}
          >
            <Close fontSize="small" />
          </IconButton>
          {/* Editable Fields */}
          <TextField
            label="Title"
            fullWidth
            margin="dense"
            value={draft.title}
            onChange={handleFieldChange('title')}
            aria-label="title"
            inputRef={titleInputRef}
          />
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateTimePicker
              label="Date & Time"
              value={draft.date ? dayjs(`${draft.date} ${draft.time || '00:00'}`) : null}
              onChange={handleDateChange}
              ampm
              slotProps={{ textField: { fullWidth: true, margin: 'dense' } }}
            />
          </LocalizationProvider>
          <TextField
            label="Location"
            fullWidth
            margin="dense"
            value={draft.location || ''}
            onChange={handleFieldChange('location')}
            aria-label="location"
          />
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <IconButton color="primary" aria-label="save" onClick={handleSave} size="small">
              <Check fontSize="small" />
            </IconButton>
          </Box>
        </>
      ) : (
        <>
          <Typography variant="h6">{event.title}</Typography>
          {event.summary ? (
            <Typography variant="body2" color="text.secondary">
              {event.summary}
            </Typography>
          ) : event.description ? (
            <Typography variant="body2" color="text.secondary">
              <em>
                {event.description.length > 80
                  ? `${event.description.slice(0, 77)}...`
                  : event.description}
              </em>
            </Typography>
          ) : null}
          <Typography variant="body2" color="text.secondary">
            📅 {event.date} {event.time && `at ${event.time}`}
          </Typography>
          {event.location && (
            <Typography variant="body2" color="text.secondary">
              📍 {event.location}
            </Typography>
          )}
          {event.confidence !== undefined && (
            <Typography variant="body2" color="text.secondary">
              ⚡ Confidence: {event.confidence}%
            </Typography>
          )}
          {/* Add to Calendar Buttons - positioned bottom-right */}
          {(() => {
            const fullDesc = buildEventDescription(
              event.description || event.summary || '',
              event.originalText
            );
            const links = generateAddToCalendarLinks({
              title: event.title,
              date: event.date,
              time: event.time,
              location: event.location,
              description: fullDesc,
            });
            const icsDataUri = `data:text/calendar;charset=utf-8,${encodeURIComponent(links.ics)}`;
            return (
              <Box
                sx={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 1 }}
                role="group"
                aria-label="Add to calendar options"
                data-testid="calendar-integration-buttons"
              >
                <Tooltip title="Add to Google Calendar" arrow>
                  <IconButton
                    component="a"
                    href={links.google}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Add event to Google Calendar"
                    size="small"
                    data-testid="google-calendar-button"
                    sx={{
                      '&:focus-visible': {
                        outline: '2px solid',
                        outlineColor: 'primary.main',
                        outlineOffset: 2,
                      },
                    }}
                  >
                    <GoogleCalendarIcon width={24} height={24} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Add to Outlook Calendar" arrow>
                  <IconButton
                    component="a"
                    href={links.outlook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Add event to Outlook Calendar"
                    size="small"
                    data-testid="outlook-calendar-button"
                    sx={{
                      '&:focus-visible': {
                        outline: '2px solid',
                        outlineColor: 'primary.main',
                        outlineOffset: 2,
                      },
                    }}
                  >
                    <OutlookIcon width={24} height={24} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download Apple Calendar file" arrow>
                  <IconButton
                    component="a"
                    href={icsDataUri}
                    download={`${event.title.replace(/\s+/g, '_')}.ics`}
                    aria-label="Download ICS file for Apple Calendar"
                    size="small"
                    data-testid="apple-calendar-button"
                    sx={{
                      '&:focus-visible': {
                        outline: '2px solid',
                        outlineColor: 'primary.main',
                        outlineOffset: 2,
                      },
                    }}
                  >
                    <AppleCalendarIcon width={24} height={24} />
                  </IconButton>
                </Tooltip>
              </Box>
            );
          })()}
          {/* Edit icon in upper-right */}
          <IconButton
            aria-label="edit"
            onClick={() => setIsEditing(true)}
            size="small"
            sx={{ position: 'absolute', top: 8, right: 8 }}
          >
            <Edit fontSize="small" />
          </IconButton>
        </>
      )}
    </Paper>
  );
};

export default EventPreviewCard;

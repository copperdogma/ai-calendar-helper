import React from 'react';
import { Box } from '@mui/material';
import EventPreviewCard, { EventPreview } from './EventPreviewCard';

interface EventPreviewListProps {
  events: EventPreview[];
  onUpdate?: (event: EventPreview) => void;
}

const EventPreviewList: React.FC<EventPreviewListProps> = ({ events, onUpdate }) => {
  if (!events || events.length === 0) return null;

  const handleUpdate = (updated: EventPreview) => {
    if (onUpdate) {
      onUpdate(updated);
    }
  };

  return (
    <Box>
      {events.map(evt => (
        <EventPreviewCard key={evt.id} event={evt} onUpdate={handleUpdate} />
      ))}
    </Box>
  );
};

export default EventPreviewList;

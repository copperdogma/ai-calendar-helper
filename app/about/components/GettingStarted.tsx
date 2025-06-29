'use client';

import { Paper, Typography, Button, Box } from '@mui/material';
import Link from 'next/link';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

/**
 * Getting Started section of the About page
 */
export default function GettingStarted() {
  return (
    <Paper
      elevation={1}
      sx={{
        p: { xs: 3, sm: 4 },
        borderRadius: 2,
      }}
    >
      <Typography variant="h5" component="h2" gutterBottom>
        How It Works
      </Typography>
      <Typography variant="body1" paragraph>
        AI Calendar Helper offers two powerful features to enhance your calendar management:
      </Typography>

      <Typography variant="h6" component="h3" gutterBottom sx={{ mt: 3 }}>
        Calendar Parser
      </Typography>
      <Typography variant="body1" paragraph>
        Transform natural language and images into calendar events:
      </Typography>
      <Typography variant="body1" component="ol" sx={{ pl: 3, mb: 3 }}>
        <li>
          <strong>Input Your Content:</strong> Paste natural language text or upload an image
          containing event information
        </li>
        <li>
          <strong>AI Processing:</strong> Our advanced AI models analyze and extract event details
          like dates, times, locations, and descriptions
        </li>
        <li>
          <strong>Review & Edit:</strong> Preview the extracted events with confidence scores and
          make any necessary adjustments
        </li>
        <li>
          <strong>Add to Calendar:</strong> Choose your preferred calendar platform (Google,
          Outlook, Apple) or download an ICS file
        </li>
      </Typography>

      <Typography variant="h6" component="h3" gutterBottom sx={{ mt: 3 }}>
        Calendar Summarizer
      </Typography>
      <Typography variant="body1" paragraph>
        Get intelligent summaries of your unique upcoming events via automated email reports. The
        system analyzes your calendar patterns to identify novel (non-recurring) events and sends
        you personalized summaries on your preferred schedule.
      </Typography>

      <Typography variant="body1" paragraph>
        The AI understands various formats including meeting invitations, handwritten notes,
        screenshots, and informal text descriptions. It automatically detects timezones, recurring
        patterns, and even conference call details.
      </Typography>

      <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          component={Link}
          href="/calendar-parser"
          variant="contained"
          startIcon={<CalendarMonthIcon />}
          sx={{ flexShrink: 0 }}
        >
          Try Calendar Parser
        </Button>
        <Button component={Link} href="/novel-events" variant="outlined" sx={{ flexShrink: 0 }}>
          Configure Summarizer
        </Button>
        <Button component={Link} href="/profile" variant="outlined" sx={{ flexShrink: 0 }}>
          Manage Settings
        </Button>
      </Box>
    </Paper>
  );
}

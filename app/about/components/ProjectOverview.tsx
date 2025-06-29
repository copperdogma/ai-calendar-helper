'use client';

import { Paper, Typography, Box, Chip } from '@mui/material';

/**
 * Project Overview section of the About page
 */
export default function ProjectOverview() {
  return (
    <Paper
      elevation={1}
      sx={{
        p: { xs: 3, sm: 4 },
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="h5" component="h2">
          Project Overview
        </Typography>
        <Chip label="100% AI-Written" color="primary" variant="outlined" size="small" />
      </Box>

      <Typography variant="body1" paragraph>
        AI Calendar Helper is a powerful personal productivity tool designed to streamline your
        calendar management through artificial intelligence. The application offers two main
        features: Calendar Parser for converting unstructured information into organized calendar
        events, and Calendar Summarizer for intelligent analysis of your upcoming unique activities.
      </Typography>

      <Typography variant="body1" paragraph>
        Whether you're processing meeting notes, email invitations, or handwritten schedules, AI
        Calendar Helper transforms natural language text and images into properly formatted calendar
        events with minimal effort. The intelligent parsing system understands context, dates,
        times, locations, and other event details to create accurate calendar entries. Additionally,
        the Calendar Summarizer analyzes your calendar patterns to identify novel events and
        delivers personalized email summaries on your preferred schedule.
      </Typography>

      <Typography variant="body1" paragraph>
        This entire project, including its architecture, implementation, and user interface, has
        been developed entirely by AI systems working collaboratively with human oversight. It
        represents a showcase of modern AI capabilities in software development and natural language
        processing.
      </Typography>
    </Paper>
  );
}

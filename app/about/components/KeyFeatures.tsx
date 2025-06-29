'use client';

import { Paper, Typography, Divider, List, ListItem, ListItemText, Box } from '@mui/material';

/**
 * Key Features section of the About page
 */
export default function KeyFeatures() {
  return (
    <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
      <Paper
        elevation={1}
        sx={{
          p: { xs: 3, sm: 4 },
          height: '100%',
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" component="h3" gutterBottom>
          Key Features
        </Typography>
        <Divider sx={{ my: 2 }} />
        <List disablePadding>
          <ListItem disableGutters>
            <ListItemText
              primary="Calendar Parser"
              secondary="Transform natural language text and images into structured calendar events with AI-powered parsing. Supports multiple formats and intelligent date/time extraction."
            />
          </ListItem>
          <ListItem disableGutters>
            <ListItemText
              primary="Smart Event Detection"
              secondary="Automatically identifies event titles, dates, times, locations, and attendees from unstructured text with high accuracy and confidence scoring."
            />
          </ListItem>
          <ListItem disableGutters>
            <ListItemText
              primary="Calendar Integration"
              secondary="Direct integration with Google Calendar, Outlook, and Apple Calendar. Generate ICS files or use deep-link integration for seamless event creation."
            />
          </ListItem>
          <ListItem disableGutters>
            <ListItemText
              primary="Calendar Summarizer"
              secondary="Intelligent analysis of your calendar to identify novel events and provide personalized email summaries of your unique upcoming activities."
            />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
}

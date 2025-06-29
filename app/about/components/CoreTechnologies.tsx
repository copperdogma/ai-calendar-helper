'use client';

import { Paper, Typography, Divider, List, ListItem, ListItemText, Box } from '@mui/material';

/**
 * Core Technologies section of the About page
 */
export default function CoreTechnologies() {
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
          Core Technologies
        </Typography>
        <Divider sx={{ my: 2 }} />
        <List disablePadding>
          <ListItem disableGutters>
            <ListItemText
              primary="OpenAI GPT-4"
              secondary="Advanced AI models for natural language processing and intelligent event extraction from text and images"
            />
          </ListItem>
          <ListItem disableGutters>
            <ListItemText
              primary="Next.js 15 + React 19"
              secondary="Modern React framework with App Router, Server Components, and TypeScript for type-safe development"
            />
          </ListItem>
          <ListItem disableGutters>
            <ListItemText
              primary="Google Calendar API"
              secondary="Seamless integration with Google Calendar for direct event creation and calendar data access"
            />
          </ListItem>
          <ListItem disableGutters>
            <ListItemText
              primary="NextAuth.js + PostgreSQL"
              secondary="Secure authentication with OAuth providers and reliable data persistence with Prisma ORM"
            />
          </ListItem>
          <ListItem disableGutters>
            <ListItemText
              primary="Material UI + Custom Theming"
              secondary="Comprehensive component library with dark/light mode support and responsive design"
            />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
}

'use client';

import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import TextInputForm from '@/components/calendar/TextInputForm';

export default function TestComponentPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Text Input Component Test
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This is a test page to verify our TextInputForm component works correctly.
        </Typography>
      </Box>

      <TextInputForm />
    </Container>
  );
}

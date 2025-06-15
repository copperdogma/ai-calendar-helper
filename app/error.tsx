'use client';

import { useEffect } from 'react';
import { Typography, Button, Paper, Container } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';
import * as Sentry from '@sentry/nextjs';
import { clientLogger } from '@/lib/client-logger';
import { getDisplayErrorMessage } from '@/lib/utils/error-display';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    clientLogger.error('Root error page caught an error', { error });
    Sentry.captureException(error);
  }, [error]);

  const displayMessage = getDisplayErrorMessage(
    error,
    'Something went wrong while loading the page.'
  );

  return (
    <Container component="div" maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 3, sm: 4 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          borderRadius: 2,
        }}
      >
        <ErrorOutline
          sx={{
            fontSize: 60,
            color: 'error.main',
            mb: 2,
          }}
        />
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'medium' }}>
          Something went wrong
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          paragraph
          sx={{ maxWidth: 450, mx: 'auto', mb: 3 }}
        >
          {displayMessage}
        </Typography>
        <Button variant="contained" onClick={() => reset()} size="large">
          Try again
        </Button>
      </Paper>
    </Container>
  );
}

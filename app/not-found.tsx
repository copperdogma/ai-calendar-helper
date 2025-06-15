'use client';

import Link from 'next/link';
import { Typography, Button, Paper, Container } from '@mui/material';
import { SearchOffOutlined } from '@mui/icons-material';

export default function NotFoundPage() {
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
        <SearchOffOutlined
          sx={{
            fontSize: 60,
            color: 'text.secondary',
            mb: 2,
          }}
        />
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'medium' }}>
          Page not found
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          paragraph
          sx={{ maxWidth: 450, mx: 'auto', mb: 3 }}
        >
          Sorry, we couldn't find the page you're looking for.
        </Typography>
        <Button variant="contained" component={Link} href="/" size="large">
          Back to Home
        </Button>
      </Paper>
    </Container>
  );
}

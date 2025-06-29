/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { useSession, signIn } from 'next-auth/react';
import { CALENDAR_SCOPE, hasCalendarScope } from '@/lib/auth/googleScope';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  Alert,
  Card,
  CardContent,
  CardHeader,
  Stack,
  Typography,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import PreferencesForm from '@/components/novel-events/PreferencesForm';
import PageLayout from '@/components/layouts/PageLayout';

export default function NovelEventsSettingsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const scopeGranted = hasCalendarScope((session as any)?.accountScope);

  const handleGrant = () => {
    setLoading(true);
    void signIn('google', {
      prompt: 'consent',
      scope: `openid email profile ${CALENDAR_SCOPE}`,
      callbackUrl: '/novel-events',
    });
  };

  const handleTestEmail = async () => {
    setTestLoading(true);
    try {
      const res = await fetch('/api/novel-events/run', {
        method: 'POST',
      });
      if (res.ok) {
        setToast({
          open: true,
          message: 'Novel events email sent!',
          severity: 'success',
        });
      } else {
        const data = await res.json();
        setToast({
          open: true,
          message: data.error ?? 'Error running detection',
          severity: 'error',
        });
      }
    } catch {
      setToast({ open: true, message: 'Request failed', severity: 'error' });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <PageLayout
      title="Novel Events Settings"
      subtitle="Configure novelty detection settings and calendar permissions"
      maxWidth="md"
    >
      <Stack spacing={4}>
        {scopeGranted ? (
          <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
            ✅ Google Calendar access granted
          </Typography>
        ) : (
          <Card variant="outlined">
            <CardHeader title="Google Calendar Access" sx={{ pb: 0 }} />
            <CardContent>
              <Alert severity="warning" icon={false} sx={{ mb: 2 }}>
                ❌ Calendar access not yet granted
              </Alert>
              <Button onClick={handleGrant} disabled={loading}>
                {loading ? 'Redirecting…' : 'Grant Calendar Access'}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card variant="outlined">
          <CardHeader title="Preferences" sx={{ pb: 0 }} />
          <CardContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Adjust the look-ahead window and novelty threshold used when detecting events.
            </Typography>
            <PreferencesForm disabled={!scopeGranted} />

            <Button
              variant="outlined"
              sx={{ mt: 3, minWidth: 250 }}
              disabled={!scopeGranted || loading || testLoading}
              onClick={handleTestEmail}
              startIcon={testLoading ? <CircularProgress size={20} /> : null}
            >
              {testLoading ? 'Calculating & Sending...' : 'Calculate Now & Send Test Email'}
            </Button>
          </CardContent>
        </Card>

        <Snackbar
          open={toast.open}
          autoHideDuration={4000}
          onClose={() => setToast({ ...toast, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity={toast.severity}
            onClose={() => setToast({ ...toast, open: false })}
            sx={{ width: '100%' }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      </Stack>
    </PageLayout>
  );
}

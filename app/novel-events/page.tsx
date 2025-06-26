"use client";

import { useSession, signIn } from "next-auth/react";
import { CALENDAR_SCOPE, hasCalendarScope } from "@/lib/auth/googleScope";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import PreferencesForm from "@/components/novel-events/PreferencesForm";
import PageLayout from "@/components/layouts/PageLayout";
import {
  Alert,
  Card,
  CardContent,
  CardHeader,
  Stack,
  Typography,
} from "@mui/material";

export default function NovelEventsSettingsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const scopeGranted = hasCalendarScope((session as any)?.accountScope);

  const handleGrant = () => {
    setLoading(true);
    void signIn("google", {
      prompt: "consent",
      scope: `openid email profile ${CALENDAR_SCOPE}`,
      callbackUrl: "/novel-events",
    });
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
                {loading ? "Redirecting…" : "Grant Calendar Access"}
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
          </CardContent>
        </Card>
      </Stack>
    </PageLayout>
  );
} 
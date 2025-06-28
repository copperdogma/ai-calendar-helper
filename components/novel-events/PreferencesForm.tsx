'use client';
import { useEffect, useState } from 'react';
import TextField from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { Stack, Snackbar, Alert } from '@mui/material';

interface Settings {
  lookAheadDays: number;
  noveltyThreshold: number;
  blacklist?: string[];
  whitelist?: string[];
}

const defaultSettings: Settings = {
  lookAheadDays: 14,
  noveltyThreshold: 0.2,
  blacklist: [],
  whitelist: [],
};

export default function PreferencesForm({ disabled = false }: { disabled?: boolean }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  // Raw text inputs so the UI preserves commas/spaces as the user types
  const [blacklistInput, setBlacklistInput] = useState<string>('');
  const [whitelistInput, setWhitelistInput] = useState<string>('');
  // true only while a save request is in-flight
  const [saving, setSaving] = useState(false);
  // true while initial settings are loading
  const [initializing, setInitializing] = useState(true);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    setInitializing(true);
    fetch('/api/novel-events/settings')
      .then(res => res.json())
      .then(data => {
        if (data && Object.keys(data).length) {
          setSettings({
            lookAheadDays: data.lookAheadDays ?? 14,
            noveltyThreshold: parseFloat(data.noveltyThreshold ?? 0.2),
            blacklist: data.blacklist ?? [],
            whitelist: data.whitelist ?? [],
          });

          setBlacklistInput((data.blacklist ?? []).join(', '));
          setWhitelistInput((data.whitelist ?? []).join(', '));
        }
      })
      .catch(() => alert('Failed to load settings'))
      .finally(() => setInitializing(false));
  }, []);

  const handleSave = () => {
    setSaving(true);
    fetch('/api/novel-events/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
      .then(res => res.json())
      .then(() => setToast({ open: true, message: 'Settings saved', severity: 'success' }))
      .catch(() => setToast({ open: true, message: 'Error saving settings', severity: 'error' }))
      .finally(() => setSaving(false));
  };

  return (
    <div style={{ opacity: disabled ? 0.5 : 1 }}>
      <Stack spacing={3} direction="column">
        <TextField
          label="Look-ahead days"
          type="number"
          value={settings.lookAheadDays}
          onChange={e => setSettings({ ...settings, lookAheadDays: Number(e.target.value) })}
          inputProps={{ min: 1, max: 60 }}
        />
        <TextField
          label="Novelty threshold (0-1)"
          type="number"
          value={settings.noveltyThreshold}
          onChange={e => setSettings({ ...settings, noveltyThreshold: Number(e.target.value) })}
          inputProps={{ min: 0, max: 1, step: 0.05 }}
        />
        <TextField
          label="Blacklist calendar IDs"
          placeholder="work, holidays@group.calendar.google.com"
          type="text"
          value={blacklistInput}
          onChange={e => {
            const text = e.target.value;
            setBlacklistInput(text);
            setSettings({
              ...settings,
              blacklist: text
                .split(',')
                .map(s => s.trim())
                .filter(Boolean),
            });
          }}
          helperText="Comma-separated list. Events from these calendars will be ignored."
        />
        <TextField
          label="Whitelist calendar IDs"
          placeholder="team-projects, personal"
          type="text"
          value={whitelistInput}
          onChange={e => {
            const text = e.target.value;
            setWhitelistInput(text);
            setSettings({
              ...settings,
              whitelist: text
                .split(',')
                .map(s => s.trim())
                .filter(Boolean),
            });
          }}
          helperText="If whitelist has entries, ONLY these calendars will be analysed."
        />
        <Button
          onClick={handleSave}
          disabled={disabled || initializing || saving}
          variant="contained"
          isLoading={saving}
          loadingText="Saving…"
        >
          Save Settings
        </Button>

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
    </div>
  );
}

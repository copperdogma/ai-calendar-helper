'use client';
import { useEffect, useState } from 'react';
import TextField from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { Stack } from '@mui/material';

interface Settings {
  lookAheadDays: number;
  noveltyThreshold: number;
}

const defaultSettings: Settings = {
  lookAheadDays: 14,
  noveltyThreshold: 0.2,
};

export default function PreferencesForm({ disabled = false }: { disabled?: boolean }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/novel-events/settings')
      .then(res => res.json())
      .then(data => {
        if (data && Object.keys(data).length) {
          setSettings({
            lookAheadDays: data.lookAheadDays ?? 14,
            noveltyThreshold: parseFloat(data.noveltyThreshold ?? 0.2),
          });
        }
      })
      .catch(() => alert('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = () => {
    setLoading(true);
    fetch('/api/novel-events/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
      .then(res => res.json())
      .then(() => alert('Settings saved'))
      .catch(() => alert('Error saving settings'))
      .finally(() => setLoading(false));
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
        <Button onClick={handleSave} disabled={disabled || loading}>
          {loading ? 'Saving…' : 'Save Settings'}
        </Button>
      </Stack>
    </div>
  );
} 
'use client';
import { useEffect, useState, useMemo } from 'react';
import TextField from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import DateTimePicker from '@/components/ui/DateTimePicker';
import { detectBrowserTimezone } from '@/lib/hooks/useTimezone';
import {
  Stack,
  Snackbar,
  Alert,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Chip,
  Box,
  Divider,
} from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';

interface Settings {
  lookAheadDays: number;
  noveltyThreshold: number;
  blacklist?: string[];
  whitelist?: string[];
}

interface BackgroundJob {
  id: string;
  jobType: string;
  schedule: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  createdAt: string;
  updatedAt: string;
  scheduleTime?: string; // ISO time string for when to run
  scheduleDayOfWeek?: number; // 0-6 for weekly (0=Sunday)
  scheduleDayOfMonth?: number; // 1-31 for monthly
}

const defaultSettings: Settings = {
  lookAheadDays: 14,
  noveltyThreshold: 0.2,
  blacklist: [],
  whitelist: [],
};

const scheduleOptions = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
];

export default function PreferencesForm({ disabled = false }: { disabled?: boolean }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [backgroundJobs, setBackgroundJobs] = useState<BackgroundJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  // Raw text inputs so the UI preserves commas/spaces as the user types
  const [blacklistInput, setBlacklistInput] = useState<string>('');
  const [whitelistInput, setWhitelistInput] = useState<string>('');

  // true only while a save request is in-flight
  const [saving, setSaving] = useState(false);

  // true while initial settings are loading
  const [initializing, setInitializing] = useState(true);

  // Schedule timing state
  const [dailyTime, setDailyTime] = useState<Dayjs>(dayjs().hour(9).minute(0).second(0));
  const [weeklyTime, setWeeklyTime] = useState<Dayjs>(dayjs().day(1).hour(9).minute(0).second(0)); // Monday 9 AM
  const [monthlyTime, setMonthlyTime] = useState<Dayjs>(
    dayjs().date(1).hour(9).minute(0).second(0)
  ); // 1st of month 9 AM

  // Local state for scheduling settings
  const [isJobEnabled, setIsJobEnabled] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState('DAILY');

  // Get current timezone
  const currentTimezone = detectBrowserTimezone();

  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Get the novel events job (if it exists) - using useMemo to update when backgroundJobs changes
  const novelEventsJob = useMemo(
    () => backgroundJobs.find(job => job.jobType === 'NOVEL_EVENTS'),
    [backgroundJobs]
  );

  useEffect(() => {
    setInitializing(true);

    // Load settings and background jobs in parallel
    Promise.all([
      fetch('/api/novel-events/settings').then(res => res.json()),
      fetch('/api/user/jobs').then(res => res.json()),
    ])
      .then(([settingsData, jobsData]) => {
        // Handle settings
        if (settingsData && Object.keys(settingsData).length) {
          setSettings({
            lookAheadDays: settingsData.lookAheadDays ?? 14,
            noveltyThreshold: parseFloat(settingsData.noveltyThreshold ?? 0.2),
            blacklist: settingsData.blacklist ?? [],
            whitelist: settingsData.whitelist ?? [],
          });

          setBlacklistInput((settingsData.blacklist ?? []).join(', '));
          setWhitelistInput((settingsData.whitelist ?? []).join(', '));
        }

        // Handle background jobs
        if (jobsData && jobsData.jobs) {
          setBackgroundJobs(jobsData.jobs);

          // Initialize scheduling state with existing job data
          const novelEventsJob = jobsData.jobs.find(
            (job: BackgroundJob) => job.jobType === 'NOVEL_EVENTS'
          );
          if (novelEventsJob) {
            setIsJobEnabled(novelEventsJob.enabled);
            setCurrentSchedule(novelEventsJob.schedule || 'DAILY');

            if (novelEventsJob.scheduleTime) {
              const [hours, minutes] = novelEventsJob.scheduleTime.split(':').map(Number);

              if (novelEventsJob.schedule === 'DAILY') {
                setDailyTime(dayjs().hour(hours).minute(minutes).second(0));
              } else if (
                novelEventsJob.schedule === 'WEEKLY' &&
                novelEventsJob.scheduleDayOfWeek !== undefined
              ) {
                setWeeklyTime(
                  dayjs()
                    .day(novelEventsJob.scheduleDayOfWeek)
                    .hour(hours)
                    .minute(minutes)
                    .second(0)
                );
              } else if (
                novelEventsJob.schedule === 'MONTHLY' &&
                novelEventsJob.scheduleDayOfMonth !== undefined
              ) {
                setMonthlyTime(
                  dayjs()
                    .date(novelEventsJob.scheduleDayOfMonth)
                    .hour(hours)
                    .minute(minutes)
                    .second(0)
                );
              }
            }
          }
        }
      })
      .catch(() => {
        setToast({
          open: true,
          message: 'Failed to load settings',
          severity: 'error',
        });
      })
      .finally(() => {
        setInitializing(false);
        setJobsLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);

    try {
      // Save novel events settings
      const settingsResponse = await fetch('/api/novel-events/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!settingsResponse.ok) {
        throw new Error('Failed to save settings');
      }

      // Save scheduling configuration if enabled
      if (isJobEnabled) {
        // Get the appropriate time based on current schedule
        let scheduleData: {
          jobType: string;
          schedule: string;
          scheduleTime?: string;
          scheduleDayOfWeek?: number;
          scheduleDayOfMonth?: number;
        } = {
          jobType: 'NOVEL_EVENTS',
          schedule: currentSchedule,
        };

        if (currentSchedule === 'DAILY') {
          scheduleData.scheduleTime = dailyTime.format('HH:mm');
        } else if (currentSchedule === 'WEEKLY') {
          scheduleData.scheduleTime = weeklyTime.format('HH:mm');
          scheduleData.scheduleDayOfWeek = weeklyTime.day();
        } else if (currentSchedule === 'MONTHLY') {
          scheduleData.scheduleTime = monthlyTime.format('HH:mm');
          scheduleData.scheduleDayOfMonth = monthlyTime.date();
        }

        if (!novelEventsJob) {
          // Create new job
          const response = await fetch('/api/user/jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(scheduleData),
          });

          if (response.ok) {
            const data = await response.json();
            setBackgroundJobs([...backgroundJobs, data.job]);
          } else {
            throw new Error('Failed to create job');
          }
        } else {
          // Update existing job
          const response = await fetch(`/api/user/jobs/NOVEL_EVENTS`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(scheduleData),
          });

          if (response.ok) {
            const data = await response.json();
            setBackgroundJobs(jobs =>
              jobs.map(job => (job.jobType === 'NOVEL_EVENTS' ? data.job : job))
            );
          } else {
            throw new Error('Failed to update job');
          }
        }
      } else if (!isJobEnabled && novelEventsJob) {
        // Disable existing job
        const response = await fetch(`/api/user/jobs/NOVEL_EVENTS`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setBackgroundJobs(jobs =>
            jobs.map(job => (job.jobType === 'NOVEL_EVENTS' ? { ...job, enabled: false } : job))
          );
        } else {
          throw new Error('Failed to disable job');
        }
      }

      setToast({
        open: true,
        message: 'All settings saved successfully',
        severity: 'success',
      });
    } catch {
      setToast({
        open: true,
        message: 'Error saving settings',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleJobToggle = (enabled: boolean) => {
    setIsJobEnabled(enabled);
  };

  const handleScheduleChange = (newSchedule: string) => {
    setCurrentSchedule(newSchedule);
  };

  const handleTimeChange = (newTime: Dayjs, scheduleType: string) => {
    if (scheduleType === 'DAILY') {
      setDailyTime(newTime);
    } else if (scheduleType === 'WEEKLY') {
      setWeeklyTime(newTime);
    } else if (scheduleType === 'MONTHLY') {
      setMonthlyTime(newTime);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString();
  };

  const formatNextRun = (dateStr?: string) => {
    if (!dateStr) return 'Not scheduled';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));

    if (diffHours < 0) return 'Overdue';
    if (diffHours < 1) return 'Within 1 hour';
    if (diffHours < 24) return `In ${diffHours} hours`;
    const diffDays = Math.round(diffHours / 24);
    return `In ${diffDays} day${diffDays === 1 ? '' : 's'}`;
  };

  return (
    <div style={{ opacity: disabled ? 0.5 : 1 }}>
      <Stack spacing={3} direction="column">
        {/* Existing Novel Events Settings */}
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

        <Divider sx={{ my: 3 }} />

        {/* Background Job Management Section */}
        <Typography variant="h6" component="h3">
          Scheduling
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Automatically check for novel events and send email summaries on your chosen schedule.
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
          Current timezone: <strong>{currentTimezone}</strong>
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={isJobEnabled}
              onChange={e => handleJobToggle(e.target.checked)}
              disabled={disabled || jobsLoading}
            />
          }
          label="Enable scheduling"
        />

        {isJobEnabled && (
          <>
            <FormControl fullWidth disabled={disabled}>
              <InputLabel>Schedule</InputLabel>
              <Select
                value={currentSchedule}
                label="Schedule"
                onChange={e => handleScheduleChange(e.target.value)}
              >
                {scheduleOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Time picker based on schedule type */}
            {currentSchedule === 'DAILY' && (
              <DateTimePicker
                label="Daily at"
                value={dailyTime}
                onChange={time => time && handleTimeChange(time, 'DAILY')}
                views={['hours', 'minutes']}
                format="HH:mm"
                disabled={disabled}
                textFieldProps={{
                  helperText: `Runs every day at ${dailyTime.format('h:mm A')} ${currentTimezone}`,
                }}
              />
            )}

            {currentSchedule === 'WEEKLY' && (
              <DateTimePicker
                label="Weekly on"
                value={weeklyTime}
                onChange={time => time && handleTimeChange(time, 'WEEKLY')}
                views={['day', 'hours', 'minutes']}
                format="dddd [at] HH:mm"
                disabled={disabled}
                textFieldProps={{
                  helperText: `Runs every ${weeklyTime.format('dddd')} at ${weeklyTime.format('h:mm A')} ${currentTimezone}`,
                }}
              />
            )}

            {currentSchedule === 'MONTHLY' && (
              <DateTimePicker
                label="Monthly on"
                value={monthlyTime}
                onChange={time => time && handleTimeChange(time, 'MONTHLY')}
                views={['day', 'hours', 'minutes']}
                format="Do [of month at] HH:mm"
                disabled={disabled}
                textFieldProps={{
                  helperText: `Runs on the ${monthlyTime.format('Do')} of each month at ${monthlyTime.format('h:mm A')} ${currentTimezone}`,
                }}
              />
            )}
          </>
        )}

        {/* Job Status Display */}
        {novelEventsJob && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Job Status
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <Chip
                label={isJobEnabled ? 'Active' : 'Disabled'}
                color={isJobEnabled ? 'success' : 'default'}
                size="small"
              />
              <Chip
                label={`Last run: ${formatDate(novelEventsJob.lastRun)}`}
                size="small"
                variant="outlined"
              />
              <Chip
                label={`Next run: ${formatNextRun(novelEventsJob.nextRun)}`}
                size="small"
                variant="outlined"
                color={isJobEnabled ? 'primary' : 'default'}
              />
            </Stack>
          </Box>
        )}

        {/* Save All Button */}
        <Button
          onClick={handleSave}
          disabled={disabled || initializing || saving}
          variant="contained"
          isLoading={saving}
          loadingText="Saving…"
          sx={{ mt: 3 }}
        >
          Save All Settings
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

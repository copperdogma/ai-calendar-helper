'use client';

import React, { useMemo } from 'react';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Tooltip,
} from '@mui/material';
import { getTimezoneOptions } from '@/lib/utils/timezone';
import { useTimezone } from '@/lib/hooks/useTimezone';

interface TimezoneSelectorProps {
  /**
   * Optional label to show above the select. Defaults to "Timezone".
   */
  label?: string;
  /**
   * If provided, called whenever the timezone changes.
   */
  onChange?: (tz: string) => void;
  /**
   * If `true`, renders a compact selector suitable for toolbars.
   */
  dense?: boolean;
}

/**
 * TimezoneSelector allows the user to view and change the active IANA timezone used throughout
 * the application. The selection is persisted in `localStorage` via {@link useTimezone}.
 */
export default function TimezoneSelector({
  label = 'Timezone',
  onChange,
  dense = false,
}: TimezoneSelectorProps) {
  const { timezone, setTimezone } = useTimezone();

  const handleChange = (e: SelectChangeEvent<string>) => {
    const tz = e.target.value;
    setTimezone(tz);
    onChange?.(tz);
  };

  // To avoid generating the heavy list on every render, memoize it.
  const options = useMemo(() => getTimezoneOptions(), []);

  return (
    <FormControl fullWidth size={dense ? 'small' : 'medium'} data-testid="timezone-selector">
      <InputLabel id="tz-select-label">{label}</InputLabel>
      <Tooltip title={`Current timezone: ${timezone}`} arrow placement="top">
        <Select
          labelId="tz-select-label"
          value={timezone}
          label={label}
          onChange={handleChange}
          MenuProps={{ PaperProps: { style: { maxHeight: 400 } } }}
        >
          {options.map(tz => (
            <MenuItem key={tz} value={tz} data-testid={`tz-option-${tz}`}>
              {tz}
            </MenuItem>
          ))}
        </Select>
      </Tooltip>
    </FormControl>
  );
}

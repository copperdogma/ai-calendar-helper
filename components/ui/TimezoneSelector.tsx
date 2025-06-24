'use client';

import React, { useMemo, useState, useRef, useLayoutEffect } from 'react';
import {
  FormControl,
  InputLabel,
  MenuItem,
  ListSubheader,
  TextField,
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

  // Track whether the Select menu is open so we can reset the search input.
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const searchRef = useRef<HTMLInputElement | null>(null);

  // Focus the search input whenever the menu opens
  useLayoutEffect(() => {
    if (open) {
      searchRef.current?.focus();
    }
  }, [open]);

  const handleChange = (e: SelectChangeEvent<string>) => {
    const tz = e.target.value;
    setTimezone(tz);
    onChange?.(tz);
    // Close select after choosing
    setOpen(false);
  };

  // To avoid generating the heavy list on every render, memoize it.
  const options = useMemo(() => getTimezoneOptions(), []);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const query = search.toLowerCase();
    return options.filter(tz => tz.toLowerCase().includes(query));
  }, [options, search]);

  return (
    <FormControl fullWidth size={dense ? 'small' : 'medium'} data-testid="timezone-selector">
      <InputLabel id="tz-select-label">{label}</InputLabel>
      <Tooltip title={`Current timezone: ${timezone}. Type to search.`} arrow placement="top">
        <Select
          labelId="tz-select-label"
          value={timezone}
          label={label}
          onChange={handleChange}
          onOpen={() => {
            setOpen(true);
            setSearch('');
          }}
          onClose={() => setOpen(false)}
          MenuProps={{
            PaperProps: { style: { maxHeight: 400 } },
            MenuListProps: { autoFocusItem: false },
          }}
        >
          {/* Render search field when menu is open */}
          {open && (
            <ListSubheader>
              <TextField
                placeholder="Search timezones…"
                size="small"
                fullWidth
                value={search}
                inputProps={{ 'data-testid': 'tz-search-input' }}
                onKeyDown={e => {
                  // Keep input from bubbling to Select but allow custom navigation
                  e.stopPropagation();

                  const listbox = searchRef.current?.closest('ul');
                  if (!listbox) return;

                  const items = Array.from(
                    listbox.querySelectorAll<HTMLElement>(
                      'li[role="option"][data-value]:not([aria-disabled="true"])'
                    )
                  );
                  if (!items.length) return;

                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    items[0].focus();
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    items[items.length - 1].focus();
                  }
                }}
                onChange={e => setSearch(e.target.value)}
                inputRef={node => {
                  searchRef.current = node;
                  if (open && node) {
                    node.focus();
                  }
                }}
              />
            </ListSubheader>
          )}
          {filtered.map(tz => (
            <MenuItem key={tz} value={tz} data-testid={`tz-option-${tz}`}>
              {tz}
            </MenuItem>
          ))}
          {filtered.length === 0 && (
            <MenuItem disabled data-testid="tz-no-results">
              No results
            </MenuItem>
          )}
        </Select>
      </Tooltip>
    </FormControl>
  );
}

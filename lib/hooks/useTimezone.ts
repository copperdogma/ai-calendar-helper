'use client';

import { useState, useContext } from 'react';
import { isValidTimezone } from '@/lib/utils/timezone';
import { TimezoneContext } from '@/lib/providers/TimezoneProvider';

/**
 * Detects the browser's current IANA timezone (e.g. "America/Los_Angeles").
 */
export function detectBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * React hook that returns the active timezone and a setter to update it.
 *
 * On mount it detects the browser timezone; callers can override for the session
 */
export function useTimezone() {
  // If inside a Provider, just return that value.
  const ctx = useContext(TimezoneContext);
  if (ctx) return ctx;

  // Fallback standalone state (e.g., in tests or components not wrapped yet)
  const [timezone, setTimezone] = useState<string>(() => {
    const detected = detectBrowserTimezone();
    return isValidTimezone(detected) ? detected : 'UTC';
  });

  return { timezone, setTimezone } as const;
}

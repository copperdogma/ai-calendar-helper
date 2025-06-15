export function isValidTimezone(tz: string): boolean {
  try {
    // Attempt to format a date with the provided zone. This will throw if invalid.
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns a list of supported IANA timezone identifiers. Uses `Intl.supportedValuesOf` when
 * available. Provides a short fallback list for environments that don't yet support the API
 * (e.g. old Node versions or JSDOM in tests).
 */
export function getTimezoneOptions(): string[] {
  // modern environments: use the full canonical list (~600 entries)
  const intlWithList = Intl as typeof Intl & {
    supportedValuesOf?: (category: 'timeZone') => string[];
  };

  if (typeof intlWithList.supportedValuesOf === 'function') {
    return intlWithList.supportedValuesOf('timeZone');
  }

  // Fallback – a concise yet representative subset to keep bundle size small in legacy envs
  return [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
  ];
}

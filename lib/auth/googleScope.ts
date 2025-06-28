export const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

/**
 * Returns true if the OAuth account's stored scope string contains the calendar scope.
 */
export function hasCalendarScope(scopeString?: string | null): boolean {
  if (!scopeString) return false;
  return scopeString.split(/\s+/).includes(CALENDAR_SCOPE);
}

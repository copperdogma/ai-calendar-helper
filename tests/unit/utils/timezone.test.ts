import { isValidTimezone } from '@/lib/utils/timezone';

describe('timezone utils', () => {
  describe('isValidTimezone', () => {
    it('returns true for a valid IANA timezone', () => {
      // Using a very common zone to avoid discrepancies across environments.
      expect(isValidTimezone('UTC')).toBe(true);
    });

    it('returns false for an invalid timezone', () => {
      expect(isValidTimezone('Mars/Phobos')).toBe(false);
    });
  });
});

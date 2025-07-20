import { compressString, decompressString } from '@/lib/utils/compression';

// Test the browser environment paths which are simpler
Object.defineProperty(global, 'window', {
  value: {},
  writable: true,
});

describe('compression utilities', () => {
  describe('compressString in browser environment', () => {
    it('should return original string with success false in browser', () => {
      const input = 'test string';

      const result = compressString(input);

      expect(result.success).toBe(false);
      expect(result.compressed).toBe(input);
    });
  });

  describe('decompressString in browser environment', () => {
    it('should return original string in browser environment', () => {
      const input = 'any string';

      const result = decompressString(input);

      expect(result).toBe(input);
    });

    it('should return original string for non-gzip input', () => {
      // Delete window to test Node.js path but non-gzip string
      delete (global as any).window;

      const input = 'regular string without gzip prefix';

      const result = decompressString(input);

      expect(result).toBe(input);

      // Restore window
      (global as any).window = {};
    });
  });
});

// Compression utilities for cache service
// Only available in Node.js environment, gracefully degrades in browser/edge

export interface CompressionResult {
  compressed: string;
  success: boolean;
}

export function compressString(input: string): CompressionResult {
  // Only attempt compression in Node.js environment
  if (typeof window !== 'undefined') {
    return {
      compressed: input,
      success: false,
    };
  }

  try {
    // Dynamic import to avoid webpack issues
    const zlib = eval('require')('zlib');
    const compressed = zlib.gzipSync(Buffer.from(input, 'utf8'));
    return {
      compressed: `gzip:${compressed.toString('base64')}`,
      success: true,
    };
  } catch {
    return {
      compressed: input,
      success: false,
    };
  }
}

export function decompressString(input: string): string {
  // Only attempt decompression in Node.js environment
  if (typeof window !== 'undefined' || !input.startsWith('gzip:')) {
    return input;
  }

  try {
    // Dynamic import to avoid webpack issues
    const zlib = eval('require')('zlib');
    const compressedData = input.slice(5); // Remove 'gzip:' prefix
    const compressedBuffer = Buffer.from(compressedData, 'base64');
    const decompressedBuffer = zlib.gunzipSync(compressedBuffer);
    return decompressedBuffer.toString('utf8');
  } catch {
    // Fallback to original string if decompression fails
    return input;
  }
}

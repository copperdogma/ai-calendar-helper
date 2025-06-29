import { z } from 'zod';
import { logger } from './logger'; // Import logger

// Environment variables schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string({
    required_error: 'DATABASE_URL is required',
    invalid_type_error: 'DATABASE_URL must be a string',
  }),
  REDIS_URL: z.preprocess(
    val => (val === '' ? undefined : val), // Treat empty string as undefined
    z
      .string()
      .url({
        message:
          'If REDIS_URL is provided, it must be a valid Redis connection URI (e.g., redis://localhost:6379).',
      })
      .refine(url => url.startsWith('redis://') || url.startsWith('rediss://'), {
        message: 'If REDIS_URL is provided, it must start with redis:// or rediss://',
      })
      .optional()
  ),
  RATE_LIMIT_REGISTER_MAX_ATTEMPTS: z.preprocess(
    val => (val === '' ? undefined : val), // Treat empty string as undefined
    z
      .string()
      .optional()
      .default('10')
      .transform(val => parseInt(val, 10))
      .refine(val => !isNaN(val) && val > 0, {
        message: 'RATE_LIMIT_REGISTER_MAX_ATTEMPTS must be a positive number.',
      })
  ),
  RATE_LIMIT_REGISTER_WINDOW_SECONDS: z.preprocess(
    val => (val === '' ? undefined : val), // Treat empty string as undefined
    z
      .string()
      .optional()
      .default('3600') // 1 hour
      .transform(val => parseInt(val, 10))
      .refine(val => !isNaN(val) && val > 0, {
        message: 'RATE_LIMIT_REGISTER_WINDOW_SECONDS must be a positive number.',
      })
  ),
  ENABLE_REDIS_RATE_LIMITING: z.preprocess(
    val => (val === '' ? undefined : val), // Treat empty string as undefined
    z
      .string()
      .optional()
      .default('true') // Default to 'true'
      .transform(val => val.toLowerCase() === 'true') // Convert string to boolean
  ),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string({
    required_error: 'GOOGLE_CLIENT_ID is required',
  }),
  GOOGLE_CLIENT_SECRET: z.string({
    required_error: 'GOOGLE_CLIENT_SECRET is required',
  }),

  // NextAuth
  NEXTAUTH_URL: z.string().url().optional(), // Optional for Vercel deployments
  NEXTAUTH_SECRET: z.string({
    required_error: 'NEXTAUTH_SECRET is required for NextAuth.js.',
  }),

  // Test User Configuration (ensure these are optional or handled gracefully if not set for production)
  TEST_USER_EMAIL: z.string().email().optional(),
  TEST_USER_PASSWORD: z.string().optional(),
});

// Export the type inferred from the schema
export type Env = z.infer<typeof envSchema>;

// Export required environment variables for utility functions
export const requiredEnvVars = [
  // Database
  'DATABASE_URL',
  // 'REDIS_URL', // Optional
  // Rate limit vars have defaults, so not strictly required in .env

  // Google OAuth
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',

  // NextAuth
  'NEXTAUTH_SECRET',
  // NEXTAUTH_URL is optional
  // TEST_USER vars are optional
] as const;

// Define union type for NODE_ENV
export type NodeEnv = 'development' | 'production' | 'test';

// Format Zod validation errors into a more readable format
function formatZodError(error: z.ZodError) {
  return error.errors
    .map(err => {
      const field = err.path.join('.');
      return `- ${field}: ${err.message}`;
    })
    .join('\n');
}

// Validate environment variables
export function validateEnv(): z.SafeParseReturnType<Env, Env> {
  // Skip validation during build phase or when process.env is not fully available
  if (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    typeof process === 'undefined' ||
    typeof process.env === 'undefined'
  ) {
    return { success: false, error: new z.ZodError([]) } as z.SafeParseReturnType<Env, Env>;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    // Only log and throw if NOT in the test environment AND we're actually running (not building)
    if (
      process.env.NODE_ENV !== 'test' &&
      typeof window === 'undefined' &&
      process.versions?.node
    ) {
      const formattedError = formatZodError(result.error);
      logger.error(
        {
          validationErrors: result.error.format(),
        },
        `❌ Invalid environment variables:\n${formattedError}`
      );
      throw new Error('Invalid environment variables');
    } else {
      // Optionally, log a less intrusive message in test env, or nothing
    }
  }

  // Return the result regardless of environment, tests might want to inspect it
  return result;
}

// Lazy environment validation - only validate when accessed
let _env: Env | null = null;

export const env = new Proxy({} as Env, {
  get(target, prop) {
    // During build phase, return undefined for all properties to avoid validation
    if (
      process.env.NEXT_PHASE === 'phase-production-build' ||
      typeof process === 'undefined' ||
      typeof process.env === 'undefined'
    ) {
      return undefined;
    }

    // Initialize env on first access
    if (_env === null) {
      const validationResult = validateEnv();
      if (!validationResult.success) {
        _env = {} as Env;
      } else {
        _env = validationResult.data;
      }
    }
    return _env[prop as keyof Env];
  },
});

// Optional environment variables with default values
export const ENV = {
  NODE_ENV: (process.env.NODE_ENV as NodeEnv) || 'development',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  API_URL: process.env.API_URL || 'http://localhost:3000/api',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_TEST: process.env.NODE_ENV === 'test',
} as const;

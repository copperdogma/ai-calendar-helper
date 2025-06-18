/**
 * @jest-environment node
 */
import { checkRequiredEnvVars } from '@/scripts/smoke-checks';

describe('checkRequiredEnvVars', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('passes when all required env vars are set', async () => {
    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
    process.env.NEXTAUTH_SECRET = 'secret';
    process.env.GOOGLE_CLIENT_ID = 'id';
    process.env.GOOGLE_CLIENT_SECRET = 'secret';
    process.env.OPENAI_API_KEY = 'key';

    const result = await checkRequiredEnvVars();
    expect(result.ok).toBe(true);
  });

  it('fails when a required env var is missing', async () => {
    delete process.env.DATABASE_URL;
    process.env.NEXTAUTH_SECRET = 'secret';
    process.env.GOOGLE_CLIENT_ID = 'id';
    process.env.GOOGLE_CLIENT_SECRET = 'secret';
    process.env.OPENAI_API_KEY = 'key';

    const result = await checkRequiredEnvVars();
    expect(result.ok).toBe(false);
    expect(result.message).toContain('DATABASE_URL');
  });
});

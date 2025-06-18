// Optional dependency – during unit tests we avoid ESM import issues.
let chalkGreen = (text: string) => text;
let chalkRed = (text: string) => text;

try {
  // Dynamically import chalk only at runtime (Node ESM), ignore failure in Jest.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const chalk = require('chalk');
  chalkGreen = typeof chalk.green === 'function' ? chalk.green : chalkGreen;
  chalkRed = typeof chalk.red === 'function' ? chalk.red : chalkRed;
} catch {
  // chalk not available or ESM import failed – fallback to no color
}

export interface CheckResult {
  name: string;
  ok: boolean;
  message: string;
}

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'OPENAI_API_KEY',
];

export async function checkRequiredEnvVars(): Promise<CheckResult> {
  const missing = REQUIRED_ENV_VARS.filter(key => !process.env[key]);
  const ok = missing.length === 0;
  return {
    name: 'Environment Variables',
    ok,
    message: ok
      ? chalkGreen('All required env vars set')
      : chalkRed(`Missing: ${missing.join(', ')}`),
  };
}

// --- Postgres / Prisma ---
export async function checkPostgres(): Promise<CheckResult> {
  try {
    // Lazy import to avoid heavy dependency if not needed
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { prisma } = require('@/lib/prisma');
    await prisma.$queryRaw`SELECT 1`;
    return { name: 'PostgreSQL', ok: true, message: chalkGreen('Connected and query succeeded') };
  } catch (err: unknown) {
    return {
      name: 'PostgreSQL',
      ok: false,
      message: chalkRed(`Connection/query failed: ${(err as Error).message}`),
    };
  }
}

// --- Redis ---
export async function checkRedis(): Promise<CheckResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getOptionalRedisClient } = require('@/lib/redis');
    const client = getOptionalRedisClient();
    if (!client) {
      return { name: 'Redis', ok: true, message: 'Redis disabled or not configured (skipped)' };
    }
    const pong = await client.ping();
    return { name: 'Redis', ok: pong === 'PONG', message: chalkGreen(pong) };
  } catch (err: unknown) {
    return {
      name: 'Redis',
      ok: false,
      message: chalkRed(`Ping failed: ${(err as Error).message}`),
    };
  }
}

// --- SMTP ---
export async function checkSMTP(full: boolean): Promise<CheckResult> {
  const { EMAIL_SMTP_USER, EMAIL_SMTP_PASS, SMOKE_TEST_EMAIL_TO } = process.env;
  if (!EMAIL_SMTP_USER || !EMAIL_SMTP_PASS) {
    return { name: 'SMTP', ok: false, message: chalkRed('EMAIL_SMTP_USER/PASS not set') };
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodemailer = require('nodemailer');
    const transport = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: EMAIL_SMTP_USER, pass: EMAIL_SMTP_PASS },
    });
    await transport.verify();

    if (full) {
      if (!SMOKE_TEST_EMAIL_TO) {
        return {
          name: 'SMTP',
          ok: false,
          message: chalkRed('SMOKE_TEST_EMAIL_TO not set for --full'),
        };
      }
      await transport.sendMail({
        from: EMAIL_SMTP_USER,
        to: SMOKE_TEST_EMAIL_TO,
        subject: 'Smoke test email',
        text: 'This is a smoke test email from AI Calendar Helper.',
      });
      return { name: 'SMTP', ok: true, message: chalkGreen('Email sent successfully') };
    }

    return { name: 'SMTP', ok: true, message: chalkGreen('Transport verified (dry-run)') };
  } catch (err: unknown) {
    return { name: 'SMTP', ok: false, message: chalkRed(`SMTP error: ${(err as Error).message}`) };
  }
}

// --- OpenAI ---
export async function checkOpenAI(): Promise<CheckResult> {
  if (!process.env.OPENAI_API_KEY) {
    return { name: 'OpenAI', ok: false, message: chalkRed('OPENAI_API_KEY not set') };
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const OpenAI = require('openai').default || require('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const models = await client.models.list({ limit: 1 });
    return {
      name: 'OpenAI',
      ok: true,
      message: chalkGreen(`Models retrieved (${models.data.length})`),
    };
  } catch (err: unknown) {
    return { name: 'OpenAI', ok: false, message: chalkRed(`API error: ${(err as Error).message}`) };
  }
}

// --- Health Route ---
export async function checkHealthRoute(): Promise<CheckResult> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3777';
  try {
    const res = await fetch(`${baseUrl}/api/health`);
    if (res.ok) {
      return { name: 'Health Endpoint', ok: true, message: chalkGreen(`Response ${res.status}`) };
    }
    return { name: 'Health Endpoint', ok: false, message: chalkRed(`Status ${res.status}`) };
  } catch (err: unknown) {
    return {
      name: 'Health Endpoint',
      ok: false,
      message: chalkRed(`Fetch error: ${(err as Error).message}`),
    };
  }
}

// --- PM2 ---
export async function checkPM2(): Promise<CheckResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pm2 = require('pm2');
    return new Promise<CheckResult>(resolve => {
      pm2.connect((connectErr: Error | null) => {
        if (connectErr) {
          resolve({ name: 'PM2', ok: false, message: chalkRed(connectErr.message) });
          return;
        }
        pm2.list((err: Error | null, list: unknown[]) => {
          pm2.disconnect();
          if (err) {
            resolve({ name: 'PM2', ok: false, message: chalkRed(err.message) });
          } else {
            resolve({ name: 'PM2', ok: true, message: chalkGreen(`Processes: ${list.length}`) });
          }
        });
      });
    });
  } catch (err: unknown) {
    return { name: 'PM2', ok: true, message: 'PM2 not installed (skipped)' };
  }
}

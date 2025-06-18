#!/usr/bin/env tsx

import Table from 'cli-table3';
import {
  checkRequiredEnvVars,
  checkPostgres,
  checkRedis,
  checkSMTP,
  checkOpenAI,
  checkHealthRoute,
  checkPM2,
  CheckResult,
} from './smoke-checks';

// Lazy chalk loading to avoid Jest ESM issues
let chalkGreen = (t: string) => t;
let chalkRed = (t: string) => t;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const chalk = require('chalk');
  chalkGreen = typeof chalk.green === 'function' ? chalk.green : chalkGreen;
  chalkRed = typeof chalk.red === 'function' ? chalk.red : chalkRed;
} catch {}

// Load environment variables early (prefers .env.local, then .env)
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const dotenv = require('dotenv');
  const fs = require('fs');
  const path = require('path');
  const envPathLocal = path.resolve(process.cwd(), '.env.local');
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPathLocal)) {
    dotenv.config({ path: envPathLocal });
  } else if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
} catch {}

async function run() {
  const args = process.argv.slice(2);
  const outputJson = args.includes('--json');
  const fullSend = args.includes('--full');

  const checks: (() => Promise<CheckResult>)[] = [
    checkRequiredEnvVars,
    checkPostgres,
    checkRedis,
    () => checkSMTP(fullSend),
    checkOpenAI,
    checkHealthRoute,
    checkPM2,
  ];

  const results = await Promise.all(checks.map(fn => fn()));

  if (outputJson) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    const table = new Table({ head: ['Subsystem', 'Status', 'Details'] });
    results.forEach(r => {
      table.push([r.name, r.ok ? chalkGreen('OK') : chalkRed('FAIL'), r.message]);
    });
    console.log(table.toString());
  }

  const failed = results.some(r => !r.ok);
  process.exitCode = failed ? 1 : 0;
}

run().catch(err => {
  console.error(chalkRed('Smoke test encountered an error:'), err);
  process.exitCode = 1;
});

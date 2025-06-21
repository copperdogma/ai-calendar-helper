#!/usr/bin/env ts-node
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from the file specified by ENV_FILE (e.g. .env.production)
// Fallback to .env.local if not provided.
const envFile = process.env.ENV_FILE || '.env.local';

const envPath = path.resolve(process.cwd(), envFile);
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  // eslint-disable-next-line no-console
  console.warn(`⚠️  Environment file '${envFile}' not found. Proceeding with process env only.`);
}

import { getTopUsers } from '@/lib/services/usage.service';
import { getTopUsersFromEvents } from '@/lib/services/usage-event.service';
import { getDailyUsageMetrics } from '@/lib/services/usage-event.service';
import { sendDailyUsageReport } from '@/lib/email';

async function main() {
  let rows = await getTopUsers({ service: 'CALENDAR_PARSER' });
  if (rows.length === 0) {
    rows = await getTopUsersFromEvents();
  }
  const metrics = await getDailyUsageMetrics();

  const body: string[] = [];
  body.push('Manual Daily Usage Report');
  body.push('');
  body.push('--- Daily Metrics ---');
  body.push(`Total requests: ${metrics.totalRequests}`);
  body.push(`Success rate: ${(metrics.successRate * 100).toFixed(1)} %`);
  body.push(`Avg parse time: ${metrics.avgParseTimeMs ?? 'n/a'} ms`);
  body.push(`Avg events extracted: ${metrics.avgEventsExtracted ?? 'n/a'}`);
  body.push('Input type breakdown:');
  Object.entries(metrics.inputTypeCounts).forEach(([type, count]) =>
    body.push(`  • ${type}: ${count}`)
  );
  body.push('');
  body.push('--- Top 20 Users (Calendar Parser) ---');
  body.push('Rank | Email | Count');
  rows.forEach((r, i) => body.push(`${i + 1}. ${r.email ?? 'Unknown'} | ${r.count}`));

  await sendDailyUsageReport(body.join('\n'));
  // eslint-disable-next-line no-console
  console.log('Daily usage report sent.');
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

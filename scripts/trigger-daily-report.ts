#!/usr/bin/env ts-node
import { getTopUsers } from '@/lib/services/usage.service';
import { sendDailyUsageReport } from '@/lib/email';

async function main() {
  const rows = await getTopUsers({ service: 'CALENDAR_PARSER' });
  const body: string[] = [];
  body.push('Manual Daily Usage Report');
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

import cron from 'node-cron';
import { getTopUsers } from '@/lib/services/usage.service';
import { sendDailyUsageReport } from '@/lib/email';

function parseSchedule(): { cronExpr: string; timezone?: string } {
  const raw = process.env.DAILY_REPORT_TIME || '07:00 UTC';
  const [timePart, tz = 'UTC'] = raw.split(' ');
  const [hourStr, minuteStr] = timePart.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const expr = `${minute} ${hour} * * *`;
  return { cronExpr: expr, timezone: tz };
}

function buildReportText(rows: { email: string | null; count: number }[]) {
  const lines: string[] = [];
  lines.push('Top 20 users – Calendar Parser');
  lines.push('Rank | Email | Count');
  rows.forEach((row, idx) => {
    lines.push(`${idx + 1}. ${row.email ?? 'Unknown'} | ${row.count}`);
  });
  return lines.join('\n');
}

export function scheduleDailyReport() {
  const { cronExpr, timezone } = parseSchedule();
  cron.schedule(
    cronExpr,
    async () => {
      const rows = await getTopUsers({ service: 'CALENDAR_PARSER' });
      const text = buildReportText(rows);
      await sendDailyUsageReport(text);
    },
    { timezone }
  );
}

// immediately schedule upon import
scheduleDailyReport();

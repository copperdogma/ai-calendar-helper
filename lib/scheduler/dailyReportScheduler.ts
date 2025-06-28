import cron from 'node-cron';
import { getTopUsers } from '@/lib/services/usage.service';
import { getTopUsersFromEvents } from '@/lib/services/usage-event.service';
import { sendDailyUsageReport } from '@/lib/email';
import { getDailyUsageMetrics, DailyUsageMetrics } from '@/lib/services/usage-event.service';

// Store reference to current scheduled task to prevent duplicates
let currentScheduledTask: ReturnType<typeof cron.schedule> | null = null;

function parseSchedule(): { cronExpr: string; timezone?: string } {
  const raw = process.env.DAILY_REPORT_TIME || '07:00 UTC';
  const [timePart, tz = 'UTC'] = raw.split(' ');
  const [hourStr, minuteStr] = timePart.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const expr = `${minute} ${hour} * * *`;
  return { cronExpr: expr, timezone: tz };
}

function buildReportText(
  rows: { email: string | null; count: number }[],
  metrics: DailyUsageMetrics
) {
  const lines: string[] = [];

  // Section: Daily Metrics
  const d = new Date();
  const dateStr = d.toISOString().split('T')[0];
  lines.push(`Daily Metrics – ${dateStr} (UTC)`);
  lines.push('------------------------------------');
  lines.push(`Total requests: ${metrics.totalRequests}`);
  lines.push(`Success: ${metrics.successCount}`);
  lines.push(`Failures: ${metrics.failureCount}`);
  lines.push(`Success rate: ${(metrics.successRate * 100).toFixed(1)}%`);
  if (metrics.avgParseTimeMs !== null) lines.push(`Avg parse time: ${metrics.avgParseTimeMs} ms`);
  if (metrics.avgEventsExtracted !== null)
    lines.push(`Avg events extracted: ${metrics.avgEventsExtracted}`);
  lines.push('Requests by input type:');
  lines.push(`  TEXT: ${metrics.inputTypeCounts['text']}`);
  lines.push(`  IMAGE: ${metrics.inputTypeCounts['image']}`);
  lines.push(`  TEXT+IMAGE: ${metrics.inputTypeCounts['text+image']}`);

  lines.push('\nTop 20 users – Calendar Parser');
  lines.push('Rank | Email | Count');
  rows.forEach((row, idx) => {
    lines.push(`${idx + 1}. ${row.email ?? 'Unknown'} | ${row.count}`);
  });
  return lines.join('\n');
}

export function scheduleDailyReport() {
  // Cancel existing scheduled task if one exists
  if (currentScheduledTask) {
    console.log('[SCHEDULER] Stopping existing daily report cron job');
    currentScheduledTask.stop();
    currentScheduledTask = null;
  }

  const { cronExpr, timezone } = parseSchedule();
  console.log(`[SCHEDULER] Scheduling daily report cron job: ${cronExpr} (${timezone})`);

  currentScheduledTask = cron.schedule(
    cronExpr,
    async () => {
      console.log('[SCHEDULER] Running daily report job');
      const [rows, metrics] = await Promise.all([
        getTopUsers({ service: 'CALENDAR_PARSER' }),
        getDailyUsageMetrics(),
      ]);

      let topUsers = rows;
      if (topUsers.length === 0) {
        topUsers = await getTopUsersFromEvents();
      }

      const text = buildReportText(topUsers, metrics);
      await sendDailyUsageReport(text);
      console.log('[SCHEDULER] Daily report job completed');
    },
    { timezone }
  );
}

// Export function to get current scheduled task info (useful for debugging)
export function getScheduledTaskInfo() {
  return {
    isScheduled: currentScheduledTask !== null,
    task: currentScheduledTask,
  };
}

// immediately schedule upon import
scheduleDailyReport();

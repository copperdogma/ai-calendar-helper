# Story 029 – Configure Monitoring & Error Tracking

**Status**: Complete

---

## Background / Motivation

The project currently lacks basic operational visibility. To surface critical events early and measure feature adoption we need lightweight monitoring that is:

- **Zero-cost** (no paid SaaS)
- **Simple to deploy locally (PM2) and in future production environments**
- **Easily extendable** to additional events/metrics later

## Scope of this Story

1. **Immediate E-mail Alerts** – Send a plain-text notification whenever a new user signs up.
2. **Daily Usage Report** – At 07:00 (configurable TZ) send a report listing the top 20 users by service usage (Calendar Parser & Novel Events Extractor).
3. **Usage Metrics Tracking** – Persist per-user service counts in the database to drive the report.
4. **Single Source of Truth for Notification Settings** – All recipients & SMTP credentials configurable via environment variables.

## Key Decisions & Rationales

| Decision                                                | Rationale                                                                                                                                 |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Nodemailer + Gmail SMTP**                             | Free forever, no vendor lock-in, easy to mock in tests. Gmail App Password overcomes Google's "less-secure-apps" deprecation (Sept 2024). |
| **Plain-text Emails**                                   | Minimises spam filtering, no design effort, readable on any client.                                                                       |
| **`node-cron` scheduler**                               | Lightweight in-process scheduler that runs under PM2 ‑ no extra infra.                                                                    |
| **`ServiceUsage` table in Prisma**                      | Normalised, efficient incremental updates and future extensibility (additional services/columns).                                         |
| **Daily report schedule via env (`DAILY_REPORT_TIME`)** | Simple human-readable `HH:mm <IANA-TZ>` (e.g., `07:00 America/Denver`). Easy to read & parse; DST handled automatically.                  |

## Environment Variables (new)

```env
# -----------------------------------------------------------------------------
# SMTP (Gmail) Credentials – *App Password required if 2FA is enabled*
# -----------------------------------------------------------------------------
EMAIL_SMTP_USER="yourgmailaddress@gmail.com"
EMAIL_SMTP_PASS="16-character-app-password"

# -----------------------------------------------------------------------------
# Notification Recipients (comma-separated list allowed)
# -----------------------------------------------------------------------------
NOTIFICATIONS_EMAIL_TO="cam.marsollier@gmail.com,second@example.com"

# -----------------------------------------------------------------------------
# Daily report send time in UTC (24-hour HH:mm)
# Cron will interpret this and run at the same absolute instant everywhere.
# -----------------------------------------------------------------------------
DAILY_REPORT_TIME="07:00 America/Denver"  # 7 AM Mountain Time (auto-adjusts DST)
```

## Data Model Changes (Prisma)

```prisma
enum Service {
  CALENDAR_PARSER
  NOVEL_EVENTS_EXTRACTOR
}

model ServiceUsage {
  id        String   @id @default(uuid())
  userId    String
  service   Service
  count     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, service])
}
```

## Acceptance Criteria

1. An email is dispatched **immediately** after a successful sign-up (NextAuth `events.createUser`).
2. A daily cron job executes at 07:00 according to `EMAIL_TIMEZONE` (default UTC if unset).
3. The job queries `ServiceUsage`, builds a plain-text table (rank, email, counts), and emails it to all recipients.
4. Novel Events Extractor column is included with zero counts until that service exists.
5. All sensitive values are read from env vars; the app fails gracefully with a descriptive log if they are missing.
6. Unit tests cover:
   - Email helper (transporter config & content)
   - ServiceUsage upsert/increment logic
   - Cron scheduler (schedule expression evaluated via `mockdate`)
7. Playwright E2E (in CI) stubs Nodemailer and asserts that sign-up triggers exactly one email.
8. All linting, type-checking, and tests pass.

## Task Breakdown

- [x] **Dependencies**: add `nodemailer`, `node-cron`, `@types/nodemailer`
- [x] **Prisma migration**: add enum & model above
- [x] **Email helper**: `lib/email/index.ts`
  - `createTransport()` using env vars
  - `sendSignupNotification(user)`
  - `sendDailyUsageReport(lines)`
- [x] **Usage service**: `lib/services/usage.service.ts`
  - `increment(userId, service)` and `getTopUsers(limit)`
- [x] **NextAuth hook**: extend `authConfigNode.events.createUser`
- [x] **API tracking**: call `increment()` in `app/api/ai/parse-events/route.ts`
- [x] **Scheduler**: `lib/scheduler/dailyReportScheduler.ts`
- [x] **Bootstrap**: import scheduler in `lib/bootstrap.ts` loaded by server entry
- [x] **Tests**: unit & e2e
- [x] **Docs & `.env.example` update**
- [x] **CLI script**: `npm run report:daily:now`

## Out-of-Scope / Future Work

- Integration with a hosted error-tracking SaaS
- HTML email templates or branding
- High-volume email provider (SES, Resend) – revisit when scale demands

---

### Open Questions

- None – all preferences confirmed by the user on 2025-06-17.

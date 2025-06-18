### Legacy Issues (from previous scratchpad)

- Write an environment check command we can run that tests the env vars are working. Connect to redis? db? smtp? Maybe this is part of the health check? npm run report:daily:now
- footer has "Your Website Name 2025"
  - \*\* external todo: update the template repo to replace this with the actual website name

## Configure Monitoring & Error Tracking (Story 029) Research & Planning Checklist

- [x] Initial research questions identified
- [x] Web research completed
- [ ] Codebase analysis completed (in-progress)
- [ ] Best practices identified ⬅ partially satisfied, will tick after codebase review
- [ ] Implementation strategy developed
- [ ] Detailed implementation checklist created
- [x] User preference questions identified and asked
- [ ] Plan reviewed and approved by user

### User Preferences

- Email delivery: Gmail SMTP
- Email format: Plain text
- Recipients: Same `NOTIFICATIONS_EMAIL_TO` value (allow multiple in env)
- Branding: Generic/plain subject lines and body; AI to decide wording
- Scheduler: Lightweight node scheduler (`node-cron`)

### Best Practices & Findings

1. Nodemailer + Gmail SMTP:
   - Requires Gmail App Password (2FA enabled) since less secure apps are deprecated (Sept 2024).
   - Use STARTTLS (host smtp.gmail.com, port 587, secure=false).
   - Keep creds in env vars (`EMAIL_SMTP_USER`, `EMAIL_SMTP_PASS`).
   - Batch sending allowed but Gmail limits (≈100-150 msgs/day personal, 2k for Workspace). Our volume is tiny.
2. Plain-text emails: keep message concise; include fallback subject/body.
3. Multiple recipients: supply comma-separated list in `to` field.
4. node-cron best-practice:
   - Import/schedule once at server boot (e.g., within a `server/cron.ts` file imported by PM2 entry point).
   - Use specific TZ to avoid DST surprises (`TZ` env or `cron.schedule(expr, fn, { timezone })`).
   - Expression for 7 AM daily: `0 7 * * *`.
5. NextAuth events:
   - `events.createUser` is triggered after successful signup; ideal hook for notification email.
6. Usage tracking options:
   - Add Prisma model `ServiceUsage` (userId, service enum, count).
   - Increment count inside each service route (parse-events etc.).
   - Daily job pulls top 20 `ORDER BY count DESC` (Calendar Parser), default 0 for Novel Events Extractor.

Checklist updates:

- [x] Web research completed
- [ ] Codebase analysis completed (in-progress)
- [ ] Best practices identified ⬅ partially satisfied, will tick after codebase review

### Proposed Implementation Strategy

1. **Dependencies**
   - Add `nodemailer` and `node-cron`.
2. **Environment Variables**
   - `EMAIL_SMTP_USER`, `EMAIL_SMTP_PASS` (Gmail app-password creds)
   - (existing) `NOTIFICATIONS_EMAIL_TO` – allow comma-separated list.
   - `DAILY_REPORT_TIME` – time string `HH:mm <IANA-TZ>` e.g., `07:00 America/Denver`.
3. **Prisma Schema**
   - Add `enum Service { CALENDAR_PARSER NOVEL_EVENTS_EXTRACTOR }`
   - Add `model ServiceUsage { id String @id @default(uuid()) userId String service Service count Int @default(0) createdAt DateTime @default(now()) updatedAt DateTime @updatedAt user User @relation(fields: [userId], references: [id], onDelete: Cascade) @@unique([userId, service]) }`
   - Generate migration & push.
4. **Email Layer** (`lib/email`)
   - Reusable transporter using env vars.
   - `sendSignupNotification(user)` – plain-text message.
   - `sendDailyUsageReport(reportLines)`.
5. **Usage Tracking Helper** (`lib/services/usage.service.ts`)
   - `increment(userId, service)` – upsert/ increment.
   - `getTopUsers(limit)` – return aggregated counts.
6. **Hook into Routes / Events**
   - **Signup**: extend `authConfigNode.events.createUser` to call `sendSignupNotification`.
   - **Calendar Parser Route**: after successful extraction, get session user, call `increment(userId, 'CALENDAR_PARSER')`.
7. **Scheduler** (`lib/scheduler/dailyReportScheduler.ts`)
   - `cron.schedule('0 7 * * *', async () => { ... })` (TZ from env).
   - Build table text: `rank | userEmail | calendarParserCount | novelExtractorCount` (zeros for latter).
   - Call `sendDailyUsageReport`.
8. **Bootstrap Scheduler**
   - Import the scheduler in a side-effect module `lib/bootstrap.ts`. Ensure PM2 entry script (`dev:test`) runs `require('@/lib/bootstrap')` early.
9. **Tests**
   - Unit tests for email service (mock Nodemailer).
   - Unit tests for usage service upsert logic.

### Implementation Checklist

- [x] Update `.env.example` & docs
- [x] Install new dependencies & types
- [x] Modify `prisma/schema.prisma`, run migration (schema updated; migration pending in CI)
- [x] Add email client & helper functions
- [x] Add usage tracking service
- [x] Wire createUser event in `auth-node.ts`
- [x] Track usage in `parse-events/route.ts`
- [x] Implement daily report scheduler
- [x] Bootstrap scheduler on server start
- [x] Write/adjust unit tests (email & usage services)
- [ ] Update story docs & README (added manual trigger script)

### Risks & Mitigations

| Risk                                        | Mitigation                                                                             |
| ------------------------------------------- | -------------------------------------------------------------------------------------- |
| Gmail SMTP quota limits / auth errors       | Use App Password; low volume; fallback log-only mode in dev                            |
| Cron task not running in serverless deploys | PM2 local dev context only; Flag to disable in prod until proper job runner configured |
| Extra Prisma migration                      | Coordinate migration file; run `npm run prisma:migrate` in CI                          |
| App crashes on missing env vars             | Guard `emailClient` with runtime checks & fallback logger                              |

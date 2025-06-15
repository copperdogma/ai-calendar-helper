# Story: Daily Usage Report Email with Top 20 Users by Service

**Status**: Planning

---

## Related Requirement

_To be linked during detailed planning phase._

## Alignment with Design

Will leverage existing analytics queries (`raw-query-service.ts`) and future background job system (Story 020).

## Objective

Generate and send a daily summary email listing the top 20 users (by event count) for each service:

1. Calendar Parser (existing)
2. Novel Events Notifier (to be built)

## Acceptance Criteria (Draft)

1. A background job runs once per day at a configurable time (default 04:00 UTC).
2. The job queries usage metrics and produces two top-20 tables (one per service).
3. An email containing these tables is sent to the project owner.
4. Email is delivered using the same free-forever provider chosen in Story 039 to avoid additional cost.
5. Job failures are logged and surfaced via existing error monitoring.
6. Unit tests cover query correctness and email renderer; E2E verifies cron scheduling and dispatch.
7. All linting, type-checking, and tests pass.

## Tasks (Initial Draft)

- [ ] Finalize research on free cron/scheduler approach (e.g., Fly Machines cron, GitHub Actions, or hosted cron trigger)
- [ ] Implement SQL query in `raw-query-service.ts` for aggregated usage metrics
- [ ] Create email template (HTML table with fallback plain text)
- [ ] Build background job (e.g., `scripts/jobs/dailyUsageReport.ts`)
- [ ] Configure cron schedule via Fly.io Machines / GitHub Actions
- [ ] Write Jest tests for query and template
- [ ] Write Playwright test (stub provider) for end-to-end flow
- [ ] Update documentation and `.env.example`

## Implementation Notes

_To be completed after research phase._

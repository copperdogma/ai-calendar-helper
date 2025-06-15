# Documentation Optimization Project (Review COMPLETE)

### Legacy Issues (from previous scratchpad)

- minor: move timezone from header into the calendar-parser page, as it's specific to that functionality
- bug: Addys birthday email input, by itself, gets the top lines cut off which means the title doesn't include that it's HER birthday
- When editing the date/time text (not using the calendar picker), hitting return re-parses the events. It should be the equivalent of clicking the "OK" button in the editing panel. When editing the event title, hiting return properly saves the changes and doesn't re-parse the events.
- footer has "Your Website Name 2025"
  - \*\* external todo: update the template repo to replace this with the actual website name

This scratchpad tracks the comprehensive audit and strategic split of project documentation into **Cursor Rules** (for AI) and **Reference Documentation** (for humans), following the guidelines in `@cimprove-project-documents.mdc`.

### Phase 1: Discovery & Strategic Categorization (COMPLETE)

- [x] Scanned all technical documentation.
- [x] Categorized docs for migration to Cursor Rules or retention as Reference Docs.
- [x] Mapped glob patterns for all auto-attached rules.

### Phase 2: Cursor Rules Review & Content Extraction (COMPLETE)

- [x] Merged `docs/TESTING.md` and `docs/testing/*` into `testing.mdc`.
- [x] Confirmed `authentication.mdc` was sufficient and removed `docs/AUTHENTICATION.md`.
- [x] Confirmed `debugging.mdc` was sufficient and removed `docs/logging.md`.
- [x] Merged `docs/formatting.md`, `docs/solid-principles.md`, and `docs/typescript-eslint-rules.md` into `formatting-linting.mdc`.
- [x] Merged `docs/deployment/*` into `deployment.mdc`.

### Phase 3: Reference Documentation Optimization (COMPLETE)

- [x] Streamlined `README.md` to point to new rules.
- [x] Streamlined `SETUP.md` to point to new rules.

### Phase 4: Implementation & Integration Strategy (COMPLETE)

- [x] Ensured `.cursor/` is NOT in `.gitignore` so rules are version-controlled.
- [x] Deleted `.cursorindexingignore` to ensure rules are indexed for context.

### Phase 5: Validation & Quality Assurance (COMPLETE)

- [x] Verified that auto-attached rules (`testing.mdc`) activate correctly based on their globs.

---

## Current Story

- Story 012: Implement Timezone Detection & Selection (Medium)

## Current Task

- Deliver initial implementation: browser detection, user-selectable timezone dropdown, persistence via localStorage, unit/component tests.

## Plan Checklist

- [x] Add util to validate and list timezones (`lib/utils/timezone.ts`)
- [x] Create React hook for timezone state with persistence (`lib/hooks/useTimezone.ts`)
- [x] Build `TimezoneSelector` UI component (`components/ui/TimezoneSelector.tsx`)
- [x] Write unit tests for utils and component
- [ ] Integrate selector into Settings page (pending Story 011 preferences)
- [ ] Ensure API calls and date rendering honour selected timezone (future task)

## Recently Completed

- Implemented utilities, hook, component, tests for basic timezone feature

## Story 014 Error Handling Research & Planning Checklist

- [x] Initial research questions identified
- [x] Web research completed (Fly.io + Sentry integration assessed)
- [x] Codebase analysis completed
- [x] Best practices identified
- [x] Implementation strategy developed
- [x] Detailed implementation checklist created
- [x] User preference questions identified and asked
- [x] Plan reviewed and approved by user

### Initial Research Questions

1. Which error monitoring service do you prefer for production (e.g., Sentry, LogRocket, or self-hosted solution)?
2. Do you want user-facing error notifications via Snackbar/Toast for unexpected errors, or silently log them?
3. Should we create custom error pages for HTTP status codes (e.g., 404, 500) with user-friendly messaging?
4. For API responses, do you favour a standardized error envelope (e.g., { success: false, error: { code, message } })?
5. Should we integrate internationalization (i18n) for error messages at this stage, or defer to a later story?

### User Preferences (Confirmed)

1. Error Monitoring: Reject Fly.io Sentry promo (avoids eventual cost). Need 100% free alternative.
2. Surface unexpected runtime errors to users via UI notifications.
3. Custom error pages for common HTTP errors (404, 500, etc.) – YES.
4. Standardized API error envelope `{ success: false, error: { code, message } }` – YES.
5. Internationalization of error messages – defer to later.

### Web Research Findings (Fly.io Error Monitoring)

- Fly.io offers an integrated Sentry extension (`flyctl ext sentry create`).
  - Promo: 1 year on Sentry Team plan per Fly org.
  - Monthly quota during promo: 50k errors, 100k perf units, 500 session replays, 1 GB attachments.
  - After promo, you must upgrade to a paid plan; cannot revert to promo.
- No native Fly.io error tracking beyond logs; the integration is the primary solution.
- Most free & simple alternative if declining Fly + Sentry:
  - Use Sentry's always-free Developer plan (5k errors/mo) directly without Fly promo.
  - Logflare (free tier) can capture logs, but not full stack traces.
  - Self-hosted open-source Sentry on Fly Postgres/LiteFS is possible but higher maintenance.
- Recommendation: Accept Fly.io Sentry promo; set reminder to reassess costs before 1-year mark.

### Codebase Analysis Findings

- Client-side ErrorBoundaries exist (`components/ErrorBoundary.tsx`, `app/error.tsx`, `app/global-error.tsx`). They log errors via `clientLogger`.
- `lib/client-logger.ts` sends logs to `/api/log/client`; needs matching API route (to investigate) and server-side handling, but lacks external error reporting integration.
- No Sentry SDK setup found (no `sentry.server.ts`, no `@sentry/nextjs` packages), indicating external error tracking not yet implemented.
- API routes rely on try/catch with manual responses; there is no shared error utility.
- Global `clientLogger` uses `fetch` or `sendBeacon` but does not integrate with Sentry.
- No standardized API error envelope established across routes; existing handlers vary.
- No custom 404 or 500 pages beyond generic Next.js error page.

### Best Practices Identified

- Use `@sentry/nextjs` SDK with Sentry's free Developer plan (5k errors/month) — no automatic upgrade or payment required.
- Optionally self-host open-source Sentry on Fly (heavier) or use Logflare-only logging stack.
- Separate client, server, and edge runtime configs (`sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`).
- Wrap Next.js App Router API routes/handlers with `withSentry` (or explicit try/catch + `captureException`).
- Enrich events: attach user context, breadcrumbs, release tags; scrub PII via `beforeSend`.
- Integrate React ErrorBoundary with Sentry `ErrorBoundary` wrapper and display user-friendly Snackbar.
- Provide custom `error.tsx`, `global-error.tsx`, `not-found.tsx` for route errors; include "Try again" button to call `reset()`.
- Standardized API error envelope: `{ success: false, error: { code, message, details? } }` with proper HTTP status.
- Use `zod` schemas for server validation; throw `ApiError` subclass; centralize conversion to HTTP response.
- Show user-facing toast notifications for unexpected errors via existing `Snackbar` component.
- Add Playwright/Jest tests for error scenarios.

### Proposed Implementation Strategy

1. **Create a free Sentry SaaS project (Developer plan)**
   - No credit card needed; copy the DSN.
2. **Add Sentry SDK to codebase**
   - `npm i -E @sentry/nextjs`
   - Run wizard to auto-generate config files.
   - Commit `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` with minimal config, reading DSN from env.
3. **Wrap Next.js config**
   - Enhance `next.config.ts` using `withSentryConfig` helper.
4. **Centralize API Error Handling**
   - Create `lib/errors/ApiError.ts` class with statusCode, code, message.
   - Create middleware/util `handleApiError()` to send standardized envelope and capture with Sentry.
5. **Update Existing API Routes**
   - Import `handleApiError` or wrap with `withSentry`.
   - Ensure all `try/catch` blocks throw/convert to `ApiError`.
6. **Client-side ErrorBoundary Upgrade**
   - Convert existing `ErrorBoundary` to use `Sentry.ErrorBoundary` wrapper internally and show Snackbar.
7. **Snackbar Notifications**
   - Reuse global `Snackbar` component to surface critical errors.
8. **Custom Error Pages**
   - Add `app/not-found.tsx`, enhance `app/error.tsx` and `app/global-error.tsx` with better UI.
9. **Logging Integration**
   - Bridge `clientLogger` to call `Sentry.captureMessage/Exception` in production mode.
10. **Tests & Validation**
    - Jest: unit tests for `ApiError` and `handleApiError`.
    - Playwright: simulate 404, forced client exception, and verify Snackbar + Sentry stubbed call.
11. **Docs & Monitoring**
    - Update README with error monitoring setup and env vars (`SENTRY_DSN`).
    - Add note that Developer plan is capped at 5k errors/mo and can remain free.

### Implementation Checklist

- [x] Install `@sentry/nextjs` (done)
- [ ] Run Sentry wizard to generate config
- [x] Wrap `next.config.ts` with `withSentryConfig` (done)
- [x] Add `SENTRY_DSN` to `.env.local` for local dev (done)
- [x] Add `SENTRY_DSN` to `.env.example` (done)
- [x] Create `lib/errors/ApiError.ts`
- [x] Create `lib/errors/handleApiError.ts`
- [~] Refactor API routes (log & health done; remaining pending)
- [ ] Update `clientLogger` to forward errors to Sentry in production
- [ ] Enhance `ErrorBoundary` to use `Sentry.ErrorBoundary` + Snackbar
- [ ] Build custom `not-found.tsx` and improve `error.tsx` & `global-error.tsx`
- [ ] Write unit tests for error utilities
- [ ] Write Playwright tests for error flows
- [ ] Update docs (README + story file)

## Email Notifications & Daily Reports Research & Planning Checklist

- [x] Initial research questions identified
- [ ] Web research completed
- [ ] Codebase analysis completed
- [ ] Best practices identified
- [ ] Implementation strategy developed
- [ ] Detailed implementation checklist created
- [x] User preference questions identified and asked
- [x] Plan reviewed and approved by user

### User Preferences (Confirmed)

| #   | Question                          | Answer                                                         |
| --- | --------------------------------- | -------------------------------------------------------------- |
| 1   | Preferred email delivery service? | Gmail SMTP via Nodemailer (App Password)                       |
| 2   | Sign-up alert details             | New user\'s email and timestamp                                |
| 3   | Daily report time                 | 07:00 Mountain Time (America/Denver)                           |
| 4   | Report format                     | Assistant chooses (opt for plain-text with simple ASCII table) |
| 5   | Recipient ENV var                 | `NOTIFICATIONS_EMAIL_TO`                                       |
| 6   | Fallback on email failure         | Throw error – Sentry captures                                  |
| 7   | Usage metrics source              | Query live from Postgres each run                              |

### Next Steps

1. Complete targeted web research on Nodemailer + Gmail SMTP best practices & quotas.
2. Analyse codebase for registration completion point and existing logging utilities.
3. Identify location for scheduled job (Fly.io \`[services]\` cron vs GitHub Actions).
4. Draft best-practice summary & implementation strategy (helpers, env vars, tests).
5. Produce detailed implementation checklist then seek final user sign-off.

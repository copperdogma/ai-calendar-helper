# Story: Comprehensive Error Handling & Sentry Integration

**Status**: Done

---

## Objective

Implement a robust error-handling strategy across the entire application so that:

1. Client-side and server-side errors are gracefully displayed to the user.
2. All unhandled exceptions are captured and sent to Sentry for monitoring.
3. API routes return consistent JSON error structures.
4. Errors are logged (client & server) without leaking sensitive details in production.
5. Unit and E2E tests cover utility helpers and UI presentation.

## Implementation Highlights

• Sentry SDK integrated for edge, server and client runtimes – see `instrumentation*.ts`, `sentry.*.config.ts`, and `next.config.ts` wrapping via `withSentryConfig`.
• Global React error boundary (`components/ErrorBoundary.tsx`) and Next.js `app/global-error.tsx` provide user-friendly fallback UIs.
• API helper `lib/errors/handleApiError.ts` standardises responses and forwards exceptions to Sentry.
• Client-side logger (`lib/client-logger.ts`) funnels messages and critical errors to `/api/log/client` and Sentry.
• Automatic background import of `lib/bootstrap.ts` ensures error-monitoring jobs (e.g., daily report scheduler) start safely.
• Extensive unit tests: `lib/utils/error-display.test.ts`, component error-handling tests, API logger tests, etc.

## Acceptance Criteria Verification

| # | Criterion | Evidence |
|---|-----------|----------|
| 1 | User-facing error pages appear without app crash | `app/global-error.tsx`, component-level `ErrorBoundary` |
| 2 | Exceptions reach Sentry | Sentry import & `captureException` in boundaries and helpers |
| 3 | Consistent JSON error responses from API | `handleApiError` used in API routes (e.g., `app/api/*/route.ts`) |
| 4 | Production hides stack traces | `getDisplayErrorMessage`, `shouldShowErrorDetails` helpers |
| 5 | Tests pass | Unit tests listed above; Playwright `ui/error-handling.spec.ts` |

All criteria are met and tests pass → **Story complete**.

## Follow-ups

• Add more granular Sentry tags/context as new features land.
• Periodically review ignored errors list. 
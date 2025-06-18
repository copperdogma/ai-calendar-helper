# Story: Implement Environment Smoke Test CLI

**Status**: Done

---

## Related Requirement

TBD – this story stems from user request to have a comprehensive readiness / smoke-test command that validates all critical runtime dependencies in a real (un-mocked) environment.

## Overview

Provide a single command that a developer or operator can run to verify that the application‟s runtime environment is correctly configured. The command performs a **smoke test** (a.k.a. _readiness test_, _system diagnostic_, or _environment verification_) against every critical subsystem:

- Database (PostgreSQL via Prisma) – establish connection & execute a trivial query.
- Redis (optional) – connect & `PING`.
- SMTP (Nodemailer) – perform transporter `verify()` and optionally send a test email.
- OpenAI credentials – call a lightweight `models.list` request.
- Google OAuth – verify required environment variables are present and well-formed.
- Health route – fetch `/api/health` and expect HTTP 200 with `{ status: 'ok' }`.
- PM2 process status – ensure `next-dev` (or production entry) is online when the server is running.

The command prints an easy-to-read table summarising each check (✅ / ❌) and exits with **non-zero exit code** if any _critical_ check fails. By default, side-effect operations (actual email delivery) are **dry-run** only; passing `--full` (or env `SMOKE_TEST_FULL=1`) enables a real email to `SMOKE_TEST_EMAIL_TO`.

## Alignment with Design

The CLI complements existing unit/E2E test suites by exercising real integrations rather than mocked adapters. It follows the _12-factor_ principle of explicit runtime dependency validation and dovetails with the monitoring stack from Story 029. Results can be surfaced in CI/CD pipelines or manually by developers before first run.

## Acceptance Criteria

1. Running `npm run smoke:test` executes the smoke test script and returns exit code 0 only when **all** critical checks pass.
2. Output includes a clear, colourised table (chalk) with columns: _Subsystem_, _Details_, _Status_.
3. Checks performed (minimum):
   • PostgreSQL connectivity and basic query.
   • Redis `PING` (skipped if `ENABLE_REDIS_RATE_LIMITING` is false/undefined).
   • Nodemailer `verify()` against Gmail SMTP credentials.
   • OpenAI API key validity (`GET /models`).
   • Presence of mandatory env vars (see `.env.example`).
   • HTTP 200 from `/api/health`.
4. Optional `--full` flag sends a real test email to address in `SMOKE_TEST_EMAIL_TO` and reports delivery success.
5. Command is documented in README and included in CI (GitHub Actions) as a separate job that does **not** spam emails (runs in dry-run mode).
6. Integration test (`npm run smoke:test:ci`) uses local test containers (Postgres, Redis, MailHog) to validate behaviour without external services.
7. Implementation passes lint, type-check, and existing test suites.

## Tasks

- [ ] Design CLI arguments & environment flags (`--full`, `--json`).
- [ ] Implement utility functions `checkPostgres()`, `checkRedis()`, `checkSMTP()`, `checkOpenAI()`, `checkHealthRoute()`.
- [ ] Create `scripts/smoke-test.ts` (TypeScript, executed via `tsx` or `ts-node`).
- [ ] Add npm scripts:
      _ `smoke:test` → `tsx scripts/smoke-test.ts`
      _ `smoke:test:ci` → `cross-env CI=1 TS_NODE_PROJECT=... tsx scripts/smoke-test.ts --json`
- [ ] Integrate colourised output using `chalk`, fallback to plain text in CI.
- [ ] Add jest integration tests (live dependencies spun up via `testcontainers`).
- [ ] Update `.env.example` with `SMOKE_TEST_EMAIL_TO` and notes about SMTP app password.
- [ ] Update README & story docs.
- [ ] User review & sign-off.

## Notes

- **"Smoke test"** is the industry-standard term for this level of end-to-end environment verification.
- Checks should run **in parallel** to minimise execution time (~3-5 s typical).
- When Redis is disabled the script should report **Skipped** rather than **Failed**.
- The script must protect sensitive data – never log raw passwords or API keys.
- Consider exposing a tiny REST endpoint `/api/smoke-test?token=...` for Ops use; out-of-scope for MVP.

## Risks & Mitigations

| Risk                                           | Mitigation                                                                                      |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Frequent execution could send many emails      | Default to dry-run; require explicit `--full` flag to send.                                     |
| Third-party API rate limits                    | Use lightweight endpoints; memoise OpenAI models list for 60 s when run repeatedly.             |
| False negatives in CI due to network flakiness | Allow 2-retry back-off for external checks; mark non-critical failures as _Warning_ in CI mode. |
| Maintaining test containers increases CI time  | Cache Docker layers; run in parallel matrix.                                                    |

## Implementation Strategy

1. **Utilities** – Build isolated async check functions returning `{ name, ok, message }`.
2. **Runner** – Orchestrate checks in `Promise.allSettled`, format output, set process exit code.
3. **Email** – Use existing `lib/email` `sendMail` function; in dry-run mode call `transporter.verify()` only.
4. **Redis & DB** – Reuse existing Prisma client and Redis client from `lib/prisma` / `lib/redis`.
5. **OpenAI** – Use `ai.ts` wrapper; call `openai.models.list()` and assert non-empty.
6. **Packaging** – Ship script under `scripts/` ; compile via tsx at runtime (no build step required).
7. **Tests** – Integration tests spawn Postgres/Redis/MailHog with `testcontainers`.

## Detailed Implementation Checklist

- [ ] Create `scripts/smoke-test.ts` scaffolding.
- [ ] Implement individual subsystem checks.
- [ ] Add CLI flags parsing with `yargs` or `commander`.
- [ ] Implement coloured table output (chalk/table).
- [ ] Wire into npm scripts.
- [ ] Write integration tests with `testcontainers`.
- [ ] Update documentation.
- [ ] Ensure CI job added.
- [ ] Final review & merge.

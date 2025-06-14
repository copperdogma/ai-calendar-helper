# Scratchpad - Work Phase

\*\*NOTES:

- All To Do items should be added as checklists.
- Do not check something off unless you're confident it's complete.
- Reorganize now and then, putting unfinished tasks at the top and finished ones at the bottom.
  \*\*

      ## Current Story

- Story 037 - Fix production profile auth/session issue

## Current Task

- Investigate root cause of missing profile (upsert user on sign-in)

## Plan Checklist

- [ ] Call prod endpoints to confirm missing user
- [ ] Inspect auth signIn callback code
- [ ] Implement prisma.user.upsert
- [ ] Add global sign-out button (optional UX)
- [ ] Unit test sign-in callback
- [ ] Redeploy and verify profile works

## Fly.io Deployment Pipeline Research & Planning Checklist

- [x] Initial research questions identified
- [x] User preference questions identified and asked
- [x] User preference answers recorded (see below)
- [ ] Web research completed
- [ ] Codebase analysis completed
- [ ] Best practices identified
- [ ] Implementation strategy developed
- [ ] Detailed implementation checklist created
- [ ] Plan reviewed and approved by user

### User Preference Answers

1. App name: `ai-calendar-helper` (new Fly.io app)
2. Postgres: Free Fly Postgres cluster, dedicated per environment.
3. Deployment workflow: manual via local `fly` commands; do not auto-deploy on every push.
4. Secrets management: `fly secrets` CLI acceptable.
5. Rollback: enable auto-rollbacks. Monitoring: user has no preference/experience; suggest minimal starter.
6. Primary region: `sea`
7. Naming convention: dev app `ai-calendar-helper-dev`, dev DB `ai-calendar-helper-dev-db`.

## Issues/Blockers

- [Log any issues]

## Recently Completed

- [Archive of completed tasks]

## Decisions Made

- [Log decisions]

## Lessons Learned

- [Log things that were tried and failed and why they failed]

Keep this file concise (<300 lines): summarize or remove outdated info regularly to prevent overloading the context. Focus on the current phase and immediate next steps.

### Web Research Key Findings

- Official Fly.io Next.js guide recommends setting `output: "standalone"` in `next.config.ts` and uses a multi-stage Dockerfile based on `node:20-alpine` to significantly reduce image size (~400 MB smaller).
- Use `fly launch` to scaffold `fly.toml` and Dockerfile; we can hand-craft them to align with best-practice (multi-stage, standalone output, secret mounts, health check).
- Release commands: `release_command` in `fly.toml` runs on an ephemeral machine in the private network with access to secrets. Best practice for Prisma is to run `prisma migrate deploy` here.
- For Postgres: `fly postgres create --initial-cluster-size 1 -a ai-calendar-helper-db` then `fly postgres attach` to app.
- Auto-rollback: Fly automatically rolls back failed deploys when `auto_rollback` left enabled (default true).

### Codebase Analysis To-Dos

- [ ] Add `output: "standalone"` to `next.config.ts`.
- [ ] Create Dockerfile (multi-stage, copy standalone output, expose 3000, healthcheck).
- [ ] Generate `fly.toml` (app name: ai-calendar-helper) with the following:
  - Primary region set to `sea`.
  - Deploy release command: `npx prisma migrate deploy` (can be run via `bash` wrapper).
  - `[env]` for `NODE_ENV=production`.
  - `[http_service]` internal_port 3000, auto_rollback true.
- [ ] Provision Postgres cluster script (docs only; user will run).
- [ ] Add README section `Deployment on Fly.io`.
- [ ] Create a make or npm script `deploy:fly` to run `fly deploy`.

### Risks & Mitigations

| Risk                                     | Mitigation                                                                                                      |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Docker image too large / slow builds     | Use standalone output, prune dev deps with multi-stage build.                                                   |
| Prisma migration fails and blocks deploy | Release command ensures migration happens before new machines start. Include proper error logging and fallback. |
| Env secrets mismatch                     | Document required secrets; provide script to sync local `.env` → `fly secrets import`.                          |
| Manual deployments forgotten             | Provide simple npm script `npm run deploy:prod` to standardize.                                                 |
| Postgres scaling needs                   | Start with free single-node cluster; document upgrade path and volume resize.                                   |

## Implementation Checklist

- [x] Update `next.config.ts` to include `output: "standalone"`
- [x] Add multi-stage `Dockerfile`
  - [ ] stage 1: build with node:20-alpine, install deps, run `npm run build`
  - [ ] stage 2: runtime with node:20-alpine, copy `.next/standalone`, `.next/static`, `public`, run `node server.js`
- [x] Create `fly.toml` with app config
  - [ ] primary_region="sea"
  - [ ] release_command="npx prisma migrate deploy"
  - [ ] http_service internal_port 3000, auto_rollback=true
  - [ ] mount volume for logs? (optional)
- [x] Add npm script `deploy:fly` invoking `fly deploy --remote-only`
- [x] Document provisioning commands in README
- [ ] Provision prod Postgres cluster and attach
- [ ] Provision dev Postgres cluster and attach
- [ ] Use `fly secrets import` to set secrets in both apps
- [ ] Local docker build & run test
- [ ] Deploy to dev, smoke test URL
- [ ] Deploy to prod, smoke test URL
- [ ] Update unit/E2E tests pipeline to run inside Docker (should still pass)
- [ ] Final docs & user sign-off

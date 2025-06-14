# Story: Set up Fly.io Deployment Pipeline

**Status**: Planning
**Status**: In Progress

---

## Related Requirement

- Project must provide a production-ready deployment path so that an MVP can be hosted for real users. (See docs/requirements.md → Hosting & Deployment section)

## Alignment with Design

- Architecture: containerized deployment targets (docs/architecture.md → Deployment)
- Design: DevOps workflow & CI/CD principles (docs/design.md → DevOps)

## Acceptance Criteria

- Application can be deployed to Fly.io in region `sea` with app name `ai-calendar-helper`.
- Free Fly Postgres clusters (prod & dev) are provisioned and attached; `DATABASE_URL` is automatically injected.
- Docker image is built using Next.js standalone output and multi-stage build (size ≤ 300 MB).
- `fly.toml` exists with:
  - primary_region = "sea"
  - `release_command = "npx prisma migrate deploy"`
  - auto_rollback enabled
  - health checks on port 3000
- Manual deployment flow works:
  - `npm run deploy:fly` builds, pushes, and updates prod environment on demand.
  - Successful deploy runs DB migrations and serves app at `https://ai-calendar-helper.fly.dev`.
- README contains step-by-step instructions for provisioning databases, setting secrets, and deploying.
- Unit/E2E tests still pass after Dockerization (CI).
- User must sign off on functionality before story can be marked complete.

## Tasks

- [ ] Update `next.config.ts` → `output: "standalone"`.
- [ ] Add multi-stage `Dockerfile` (builder → runtime) with healthcheck.
- [ ] Generate `fly.toml` with region, release command, services.
- [ ] Script: `npm run deploy:fly` (wraps `fly deploy`).
- [ ] Provision Postgres clusters
  - [ ] `fly postgres create --initial-cluster-size 1 -a ai-calendar-helper-db --region sea`
  - [ ] `fly postgres attach --app ai-calendar-helper ai-calendar-helper-db`
  - [ ] Repeat for `-dev` environment.
- [ ] Add README section "Deployment on Fly.io".
- [ ] Document secret setup (`fly secrets import < .env.production`).
- [ ] Local test: `docker build` + `docker run -p 3000:3000`.
- [ ] Dev deploy test (`ai-calendar-helper-dev`).
- [ ] Prod deploy test (`ai-calendar-helper`).
- [ ] Update story status to **In Progress** once implementation starts.

## Notes

- Keep GitHub Action plan optional; starting with manual `fly deploy` per user preference.
- Consider adding monitoring later (story 029).

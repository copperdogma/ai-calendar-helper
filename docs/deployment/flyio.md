# Deploying AI Calendar Helper to Fly.io

This guide captures the **exact working steps** we followed (and pitfalls fixed) while implementing Story 028.

> **TL;DR** — Quick cheat-sheet is at the top; detailed rationale and troubleshooting follow.

---

## Quick Deployment Checklist

```bash
# 1. Install & login
brew install flyctl          # or see official docs
fly auth login

# 2. Create app
fly apps create ai-calendar-helper --org personal --region sea

# 3. Provision DB
fly postgres create \
  --name ai-calendar-helper-db \
  --region sea \
  --initial-cluster-size 1 \
  --volume-size 1
fly postgres attach --app ai-calendar-helper ai-calendar-helper-db

# 4. Secrets
cp env.production.example .env.production   # fill real values
fly secrets import < .env.production --app ai-calendar-helper

# 5. Deploy (remote builder)
npm run deploy:fly            # wraps: fly deploy --remote-only

# 6. Health check
curl -f https://ai-calendar-helper.fly.dev/api/health   # expect HTTP 200 OK
```

---

## Repository Artefacts

- **`Dockerfile`** – Multi-stage, `output: "standalone"`, copies Prisma schema & CLI.
- **`fly.toml`** – Key fields:
  - `primary_region = "sea"`
  - `[deploy] release_command = "prisma migrate deploy --schema=./db/schema.prisma"`
  - `[vm] size = "shared-cpu-1x", memory_mb = 512` (release + runtime)
- **`package.json`** – `deploy:fly` script.
- **`env.production.example`** – Template for secrets (never commit real values).

---

## Detailed Steps & Rationale

### 1 App & DB Naming Convention

| Environment | App Name                 | Postgres Name               |
| ----------- | ------------------------ | --------------------------- |
| Production  | `ai-calendar-helper`     | `ai-calendar-helper-db`     |
| Development | `ai-calendar-helper-dev` | `ai-calendar-helper-dev-db` |

### 2 Dockerfile Highlights

1. **Build stage**
   - `node:20-alpine`, `apk add openssl` (Prisma TLS).
   - `npm ci --omit=optional` keeps image reproducible.
   - `npx prisma generate --schema=./prisma/schema.prisma` before `npm run build`.
2. **Runtime stage**
   - Copies `.next/standalone`, `.next/static`, `public/`.
   - Copies full `node_modules` + `.prisma` client + packaged `prisma` CLI (fixes Fly symlink requirement).
   - Exposes `3000`; default CMD from Next.js standalone (`node server.js`).

### 3 Release-time DB Migrations

- `fly deploy` spins an _ephemeral release VM_ that runs `release_command` **before** rolling machines.
- Command: `prisma migrate deploy --schema=./db/schema.prisma` (no `npx` → uses bundled CLI).
- Memory bump (`[vm] memory_mb = 512`) avoids OOM on larger schemas.

### 4 Secrets Management

1. Copy template → `.env.production`; fill.
2. Pipe secrets once:
   ```bash
   fly secrets import < .env.production -a ai-calendar-helper
   ```
3. **No redeploy required**; machines restart automatically.

### 5 Common Pitfalls & Fixes

| Symptom                                                 | Root Cause                                                                      | Fix                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --- | ---------------------- |
| `Cannot find module '/app/prisma'` in `release_command` | Prisma CLI symlink expects a folder named `prisma`; our schema was copied there | Copy `node_modules/prisma` to `/app/prisma` **and** move schema to `/app/db/schema.prisma`. |
| `default level:info must be included in custom levels`  | Fly's default `LOG_LEVEL` env is upper-case (`INFO`) which breaks Pino          | Coerce to lower-case in `lib/logger.ts`.<br>`level: (process.env.LOG_LEVEL                  |     | 'info').toLowerCase()` |
| OOM during migrations                                   | Release VM default memory ≈ 256 MB                                              | `[vm] memory_mb = 512` in `fly.toml`                                                        |

### 6 Zero-Downtime Rollouts & Rollbacks

- Fly auto-rolls back if `release_command` fails.
- Manual rollback:
  ```bash
  fly releases             # copy IMAGE column of last good
  fly deploy --image <IMAGE_SHA>
  ```

---

## Updating the Guide

Please keep this doc in sync with any future Fly-related changes. A short call-out in `README.md` links here.

# AI Agent Setup Guide

This template is designed for AI agents to quickly set up a Next.js application with NextAuth.js authentication and PostgreSQL database.

It should take an AI agent about 5 minutes to fully set up, not including the time it will take you to create a Google OAuth client ID and secret on their website.

## Prerequisites

- PostgreSQL server running and accessible
- Node.js environment with npm
- Terminal/shell access

## Quick Start (TL;DR)

1. **Clone** the repo and enter it:
   ```bash
   git clone https://github.com/cam/ai-calendar-helper.git && cd ai-calendar-helper
   ```
2. **Install** dependencies (peer-deps flag avoids Jest version conflicts):
   ```bash
   npm install --legacy-peer-deps
   ```
3. **Configure** project placeholders:
   ```bash
   cp setup-answers.example.json setup-answers.json
   # Edit setup-answers.json as needed, then run:
   node scripts/setup.js --config setup-answers.json
   ```
4. **Run initial migration**:
   ```bash
   npx dotenv-cli -e .env.local npx prisma migrate dev
   ```
5. **Launch** the dev server via PM2:
   ```bash
   npm run ai:start
   ```
6. **Verify** everything is healthy:
   ```bash
   npm run ai:health
   ```

_After completing these steps, consult the detailed sections below for deeper explanations, environment variables, and optional services._

## Setup Process

### 1. Repository Setup

```bash
git clone <your-repo-url>
cd <your-project-directory>
```

### 2. Dependencies Installation

```bash
# Note: --legacy-peer-deps required due to jest version conflicts
npm install --legacy-peer-deps
```

### 3. Project Configuration

```bash
# Run automated setup with pre-configured answers
node scripts/setup.js --config setup-answers.json
```

The `setup-answers.json` file should contain:

```json
{
  "YOUR_PROJECT_NAME": "your-project-name",
  "YOUR_PROJECT_DESCRIPTION": "Your project description",
  "YOUR_COPYRIGHT_HOLDER": "Your Name or Company",
  "YOUR_PROJECT_URL": "https://your-project.example.com",
  "YOUR_REPOSITORY_URL": "https://github.com/your-username/your-project-name",
  "YOUR_AUTHOR_NAME": "Your Name",
  "YOUR_AUTHOR_EMAIL": "you@example.com",
  "YOUR_APP_TITLE": "Your App Title",
  "YOUR_APP_SHORT_NAME": "YourApp",
  "YOUR_APP_NAME": "Your Application Name",
  "YOUR_APP_DESCRIPTION": "A description for your application",
  "YOUR_DATABASE_NAME_DEV": "your_dev_db_name",
  "YOUR_DATABASE_NAME_TEST": "your_test_db_name",
  "YOUR_DATABASE_NAME": "your_main_db_name",
  "DATABASE_URL": "postgresql://postgres:postgres@localhost:5432/your_dev_db_name?schema=public",
  "GOOGLE_CLIENT_ID": "",
  "GOOGLE_CLIENT_SECRET": "",
  "REDIS_URL": "",
  "overwriteEnv": true
}
```

**Database URL Notes:**

- Use `127.0.0.1` instead of `localhost` if connection issues occur (Prisma error P1001)
- PostgreSQL user must have database creation privileges (superuser or `CREATEDB` role)
- Default `postgres:postgres` credentials work for local development
- Database will be created automatically if it doesn't exist

**Important:** Ensure `dotenv-cli` is available as a development dependency for environment variable loading.

### 4. Database Migration

```bash
npx dotenv-cli -e .env.local npx prisma migrate dev
```

This creates necessary tables based on `prisma/schema.prisma`.

For ongoing database operations, such as creating new migrations or browsing data, see **`@database.mdc`**.

### 5. Server Management & Deployment

For starting, stopping, and monitoring the development server with PM2, or for deploying the application to a hosting environment like Fly.io, refer to the detailed procedures in **`@deployment.mdc`**.

### 6. Validation

To quickly verify that your environment variables and external services are wired correctly, run the **Environment Smoke Test**:

```bash
npm run smoke:test           # colourised table output
npm run smoke:test -- --json # JSON output (useful for CI logs)
```

If you want to perform a real email send, append `--full` (requires `SMOKE_TEST_EMAIL_TO` env var).

The smoke test checks:
• Required environment variables
• PostgreSQL connectivity
• Redis (if configured)
• SMTP transporter (dry-run by default)
• OpenAI API key validity
• Application health endpoint
• PM2 process status

A non-zero exit code indicates a failure you should fix before proceeding.

## Environment Variables

The setup script automatically creates `.env.local` with:

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Auto-generated secure secret (or use `openssl rand -base64 32`)
- `NEXTAUTH_URL`: Application base URL
- `GOOGLE_CLIENT_ID/SECRET`: For Google OAuth (optional)
- `REDIS_URL`: For Redis services (optional)

**Manual Configuration Alternative:**
If needed, copy `.env.example` to `.env.local` and manually configure the variables above.

## Authentication Setup

Core authentication uses NextAuth.js with Prisma Adapter:

- Google OAuth and credentials providers supported
- User data stored in PostgreSQL
- Session management via JWT tokens
- Configuration in `lib/auth-shared.ts`

## Google OAuth Configuration (Optional)

If using Google Sign-In, see **`@authentication.mdc`** for guidance on provider configuration.

## Project Structure

Key directories and files:

- `app/`: Next.js 13+ App Router pages and API routes
- `components/`: Reusable UI components
- `lib/`: Utilities, authentication, and services
- `prisma/`: Database schema and migrations
- `tests/`: Unit and E2E test suites

## Optional Firebase Services

This template does **not** use Firebase for core authentication, but you can integrate other Firebase services:

1. Set up a Firebase project in the Firebase Console
2. Add Firebase client configuration variables to `.env.local`
3. The route `app/api/test/firebase-config/route.ts` provides client-side Firebase config (requires `ALLOW_FIREBASE_CONFIG_ENDPOINT=true` in `.env.local` for development/testing)

## Commands Reference

```bash
# Setup and dependencies
npm install --legacy-peer-deps
node scripts/setup.js --config setup-answers.json

# Database
npx dotenv-cli -e .env.local npx prisma migrate dev

# Server management
npm run ai:start              # Development (3001)
npm run ai:start:test         # Test environment (3777)
npm run ai:health            # Health check

# Testing
npm run test:unit            # Unit tests
npm run test:e2e            # End-to-end tests

# Utilities
npm run ai:status            # PM2 status
npm run ai:logs              # View logs
npm run ai:stop              # Stop server
```

## Troubleshooting

**Common Issues:**

- **Setup script fails**: Ensure using Node.js with dynamic import support
- **Database connection**: Try `127.0.0.1` instead of `localhost` in DATABASE_URL
- **Permission errors**: Ensure PostgreSQL user has CREATEDB privileges
- **Port conflicts**: Check if ports 3001/3777 are available
- **Dependency conflicts**: Use `--legacy-peer-deps` flag

**Health Check:**

```bash
npm run ai:health
# Should return: {"status": "ok", "uptime": X, "timestamp": "...", "serverInfo": {...}}
```

This template is optimized for AI agent deployment and automation while maintaining human usability as a secondary consideration.

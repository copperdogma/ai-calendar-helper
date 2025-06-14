# AI Calendar Helper

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

AI Calendar Helper is a modern web application that converts natural language to Google Calendar events and extracts novel events summaries. Built with Next.js, NextAuth.js v5, and PostgreSQL.

## Features

### 🗓️ Text-to-Calendar

- Convert natural language descriptions into structured Google Calendar events
- AI-powered parsing using OpenAI GPT-4
- Automatic event creation with proper scheduling

### 📧 Novel Events Extraction

- Extract and summarize unique calendar events
- Email automated summaries of interesting activities
- Configurable filters for event types and frequency

## Core Technologies

- **Framework**: Next.js 15+ (App Router)
- **Authentication**: NextAuth.js v5 (Prisma Adapter for PostgreSQL)
  - Providers: Google OAuth, Email/Password (Credentials)
- **Database**: PostgreSQL with Prisma ORM
- **AI Integration**: OpenAI GPT-4 API
- **Calendar Integration**: Google Calendar API
- **UI**: Material UI (MUI) with custom theming
- **Testing**: Jest (Unit), Playwright (E2E)
- **Language**: TypeScript
- **Caching/Rate Limiting**: Redis

## Quick Start

1. **Clone**: `git clone https://github.com/cam/ai-calendar-helper.git && cd ai-calendar-helper`
2. **Install Dependencies**: `npm install --legacy-peer-deps`
3. **Configure Project**:
   - Copy template: `cp setup-answers.example.json setup-answers.json`
   - Edit `setup-answers.json` with your project details
   - Run setup: `node scripts/setup.js --config setup-answers.json`
4. **Database Migration**: `npx dotenv-cli -e .env.local npx prisma migrate dev`
5. **Start AI Server**: `npm run ai:start`
6. **Health Check**: `npm run ai:health`

## Project Structure

```
ai-calendar-helper/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/         # NextAuth.js endpoints
│   │   ├── calendar/     # Google Calendar integration
│   │   ├── ai/          # OpenAI service endpoints
│   │   └── health/      # Health check
│   ├── dashboard/        # Main dashboard
│   ├── login/           # Authentication pages
│   └── profile/         # User profile
├── components/            # Reusable React components
│   ├── auth/             # Authentication components
│   ├── ui/              # Base UI components (MUI based)
│   ├── calendar/        # Calendar-specific components
│   └── ai/              # AI service components
├── lib/                  # Core utilities and configurations
│   ├── auth/            # Authentication helpers
│   ├── services/        # External service integrations
│   │   ├── openai.ts   # OpenAI service
│   │   ├── calendar.ts # Google Calendar service
│   │   └── email.ts    # Email service
│   ├── prisma.ts        # Prisma client
│   └── redis.ts         # Redis client
├── prisma/              # Database schema and migrations
├── tests/               # Comprehensive test suite
│   ├── e2e/            # End-to-end tests
│   └── unit/           # Unit tests
└── docs/                # Project documentation
    ├── requirements.md  # Project requirements
    ├── architecture.md  # Technical architecture
    └── stories/        # User stories and tasks
```

## Key Commands

### Development

- `npm run dev`: Start development server
- `npm run build`: Create production build
- `npm run start`: Start production server

### AI Agent Server Management (PM2)

- `npm run ai:start`: Start dev server managed by PM2
- `npm run ai:stop`: Stop PM2-managed server
- `npm run ai:health`: Check health endpoint
- `npm run ai:logs`: Show server logs
- `npm run ai:status`: Check PM2 status

### Testing

- `npm test`: Run all Jest unit tests
- `npm run test:e2e`: Run Playwright E2E tests
- `npm run test:coverage`: Run unit tests with coverage

### Code Quality

- `npm run lint`: Check ESLint issues
- `npm run format`: Format code with Prettier
- `npm run type-check`: Run TypeScript compiler

## Environment Variables

Key variables to configure in `.env.local`:

### Database & Authentication

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Secret for NextAuth.js (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL`: Base URL (e.g., `http://localhost:3000`)

### OAuth Providers

- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret

### AI Services

- `OPENAI_API_KEY`: OpenAI API key for GPT-4
- `OPENAI_MODEL`: Model to use (default: gpt-4)

### External Services

- `REDIS_URL`: Redis connection string (optional)
- `GMAIL_CLIENT_ID`: Gmail API credentials (for email features)
- `GMAIL_CLIENT_SECRET`: Gmail API credentials

## Setup Guide

### 1. Database Setup

Ensure PostgreSQL is running:

```bash
# Check if PostgreSQL is running
brew services list | grep postgres

# Start PostgreSQL if needed
brew services start postgresql@14
```

### 2. Environment Configuration

The setup script creates `.env.local` with proper configuration:

```bash
node scripts/setup.js --config setup-answers.json
```

### 3. Database Migration

```bash
npx dotenv-cli -e .env.local npx prisma migrate dev
```

### 4. Google OAuth Setup

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google Calendar API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Update `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`

### 5. OpenAI API Setup

1. Create an account at [OpenAI](https://platform.openai.com/)
2. Generate an API key
3. Update `OPENAI_API_KEY` in `.env.local`

## Authentication

- Uses NextAuth.js v5 with Prisma Adapter for PostgreSQL
- Supports Google OAuth and email/password authentication
- Protected routes managed by middleware
- Session management with secure cookies
- Configuration in `lib/auth/` directory

## Database Schema

The application uses Prisma with PostgreSQL for:

- **Users**: Authentication and profile data
- **Accounts**: OAuth account linking
- **Sessions**: Session management
- **NovelEventsConfig**: User preferences for event extraction
- **VerificationTokens**: Email verification

## API Routes

### Authentication

- `/api/auth/*`: NextAuth.js managed endpoints

### AI Services

- `/api/ai/text-to-calendar`: Convert text to calendar events
- `/api/ai/extract-events`: Extract novel events from calendar

### Calendar Integration

- `/api/calendar/events`: Manage Google Calendar events
- `/api/calendar/sync`: Sync calendar data

### User Management

- `/api/user/me`: Current user profile
- `/api/user/preferences`: User preferences

## Development Workflow

1. **Planning Phase**: See `docs/stories.md` for current user stories
2. **Implementation**: Follow stories in `docs/stories/` directory
3. **Testing**: Write unit and E2E tests for all features
4. **Code Quality**: Use ESLint, Prettier, and TypeScript
5. **Documentation**: Update relevant docs as features are added

## Contributing

1. Check `docs/stories.md` for current priorities
2. Create feature branches from `main`
3. Write tests for new functionality
4. Ensure all tests pass: `npm test && npm run test:e2e`
5. Format code: `npm run format`
6. Submit pull request

## Deployment

The application is configured for deployment on Vercel or similar platforms:

+> **Fly.io**: see [`docs/deployment/flyio.md`](docs/deployment/flyio.md) for the authoritative, step-by-step guide used in production.

-

* Environment variables configured in deployment platform
* Database migrations run automatically
* Static assets optimized for production

## Deployment on Fly.io

Follow these steps to deploy the application to Fly.io. Commands assume you have installed the Fly CLI (`brew install flyctl` or see Fly docs) and run `fly auth login`.

### 1. Create and configure the production app

```bash
# Launch a new Fly app (will detect Dockerfile)
fly launch --name ai-calendar-helper --region sea --now --copy-config
```

This generates `fly.toml` (already committed) and deploys once. You can skip deployment with `--no-deploy` if you only want config.

### 2. Provision and attach Postgres clusters

Production DB:

```bash
fly postgres create \
  --initial-cluster-size 1 \
  --volume-size 1 \
  --region sea \
  -a ai-calendar-helper-db

# Attach database to app – adds DATABASE_URL secret automatically
fly postgres attach --app ai-calendar-helper ai-calendar-helper-db
```

Dev DB (optional):

```bash
fly postgres create --initial-cluster-size 1 --volume-size 1 --region sea -a ai-calendar-helper-dev-db
fly postgres attach --app ai-calendar-helper-dev ai-calendar-helper-dev-db
```

### 3. Set secrets

Export the variables you need in `.env.production` (exclude NEXT*PUBLIC* variables you wish to bake at build time):

```bash
fly secrets import < .env.production
```

Repeat for the dev app (`-a ai-calendar-helper-dev`).

### 4. Deploy

```bash
npm run deploy:fly            # builds image, pushes, releases prod
# For dev environment:
FLY_APP=ai-calendar-helper-dev fly deploy --remote-only
```

The `release_command` defined in `fly.toml` runs `npx prisma migrate deploy` on an ephemeral machine before new instances start.

### 5. Health check & rollback

Visit `https://ai-calendar-helper.fly.dev/api/health` after deploy. If the check fails, Fly auto-rolls back to the previous stable release.

### 6. Rollbacks & monitoring

Run `fly releases` to view previous versions and `fly deploy --image <IMAGE_ID>` to roll back manually. Consider enabling Fly's built-in metrics or log-ship to Grafana Cloud (story 029).

---

For detailed DevOps workflow decisions, see `/docs/stories/story-028-deployment.md`.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For questions or issues:

1. Check the documentation in `docs/`
2. Review existing issues in the repository
3. Create a new issue with detailed information

---

Built with ❤️ using Next.js, NextAuth.js, and modern web technologies.

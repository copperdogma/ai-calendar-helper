# Project Architecture

AI Calendar Helper

**START CRITICAL NOTES -- DO NOT REMOVE**
- This document details the architectural decisions and setup progress for the project.
- Keep this document formatted according to `architecture-template.md`
- Should we transition to the next phase? `scratchpad.mdc` will explain what script to run to do that.
**END CRITICAL NOTES -- DO NOT REMOVE**

---

## Architectural Decisions

### Core Stack
- **Framework**: Next.js 15+ (App Router) - chosen for server-side rendering, API routes, and optimal performance
- **Authentication**: NextAuth.js v5 with Prisma adapter - provides secure Google OAuth for Calendar API access
- **Database**: PostgreSQL with Prisma ORM - reliable data persistence for user preferences and configurations
- **Caching**: Redis - for rate limiting, session caching, and calendar data optimization
- **UI Framework**: Material UI (MUI) - consistent design system with calendar-friendly components
- **Language**: TypeScript - type safety throughout the stack

### Template Integration
- **Base Template**: [next-authjs-psql-base-template](https://github.com/copperdogma/next-authjs-psql-base-template)
- **Pre-configured Features**: Authentication, database setup, middleware, testing framework
- **Development Tools**: ESLint, Prettier, Jest, Playwright for comprehensive development workflow

### AI Processing
- **Primary AI Service**: OpenAI GPT-4 - high accuracy for natural language event extraction
- **Processing Strategy**: Single comprehensive prompt vs. multiple parallel calls for consistency
- **Confidence Scoring**: Field-level confidence metrics for extracted event data

### External Integrations
- **Google Calendar API**: OAuth 2.0 integration with proper scope management
- **Email Service**: For novel events summary delivery (implementation TBD - likely AWS SES or similar)
- **Hosting**: fly.io (user's existing account and preference)

### Security Architecture
- **Session Management**: Database-backed sessions with NextAuth.js (not JWT)
- **API Protection**: Server-side session validation, rate limiting via Redis
- **OAuth Security**: PKCE enabled, secure token storage, refresh token handling
- **Data Encryption**: Environment variables secured, database connections encrypted

## Setup Progress

### Phase 1: Project Foundation
- [x] Choose base template (NextAuth.js + PostgreSQL + Redis)
- [x] Define architecture and tech stack decisions
- [x] Update design document to align with template
- [ ] Initialize project from template
- [ ] Configure environment variables for development
- [ ] Set up local PostgreSQL and Redis instances

### Phase 2: Authentication & Calendar Integration  
- [ ] Configure NextAuth.js Google provider with Calendar scope
- [ ] Set up Google Cloud Console project and OAuth credentials
- [ ] Test Google Calendar API integration
- [ ] Implement protected routes and middleware
- [ ] Create user preferences database schema

### Phase 3: Text-to-Calendar Feature
- [ ] Set up OpenAI API integration
- [ ] Implement natural language processing service
- [ ] Create event extraction and validation logic
- [ ] Build text input UI components
- [ ] Implement Google Calendar event creation
- [ ] Add ICS file generation capability

### Phase 4: Novel Events Extraction
- [ ] Design background job architecture
- [ ] Implement calendar event filtering logic
- [ ] Create email template and delivery service
- [ ] Build configuration UI for user preferences
- [ ] Set up scheduled job execution

### Phase 5: Testing & Deployment
- [ ] Write comprehensive unit tests
- [ ] Implement E2E testing with Playwright
- [ ] Configure deployment pipeline for fly.io
- [ ] Set up monitoring and error tracking
- [ ] Performance optimization and caching strategy

## Database Schema Design

### Core Tables (via Prisma)
```prisma
model User {
  id                    String    @id @default(cuid())
  email                 String    @unique
  name                  String?
  googleAccessToken     String?   @encrypted
  googleRefreshToken    String?   @encrypted
  timezone              String    @default("UTC")
  novelEventsConfig     NovelEventsConfig?
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
}

model NovelEventsConfig {
  id                    String    @id @default(cuid())
  userId                String    @unique
  user                  User      @relation(fields: [userId], references: [id])
  enabled               Boolean   @default(false)
  emailAddress          String
  schedule              String    // 'daily', 'weekdays', etc.
  timeOfDay             String    // HH:MM format
  timeWindow            Int       @default(7) // days to look ahead
  excludedCategories    String[]  // JSON array
  maxResults            Int       @default(50)
}
```

### Caching Strategy (Redis)
- **Session Cache**: NextAuth.js session data (1 hour TTL)
- **Calendar Cache**: Recent calendar events (30 minutes TTL)
- **Rate Limiting**: API call limits per user
- **Novel Events Cache**: Daily summaries (24 hour TTL)

## Component Architecture

### Directory Structure
```
ai-calendar-helper/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth.js endpoints
│   │   ├── calendar/      # Calendar operations
│   │   └── extract/       # Text processing
│   ├── dashboard/         # Main application UI
│   └── settings/          # Configuration pages
├── components/            # Reusable UI components
│   ├── auth/             # Authentication components
│   ├── calendar/         # Calendar-specific UI
│   ├── forms/            # Form components
│   └── ui/               # Base UI components (from template)
├── lib/                  # Utility functions
│   ├── auth.ts           # NextAuth configuration
│   ├── calendar.ts       # Google Calendar API
│   ├── ai.ts             # OpenAI integration
│   ├── email.ts          # Email service
│   └── jobs.ts           # Background jobs
└── prisma/               # Database schema and migrations
```

## Performance Considerations

### Client-Side Optimization
- Code splitting at route level
- React Server Components for optimal rendering
- Progressive Web App (PWA) capabilities
- Efficient state management with React hooks

### Server-Side Optimization
- Redis caching for frequent operations
- Database query optimization with Prisma
- API rate limiting and request queuing
- Background job processing for novel events

### Scalability Strategy
- Stateless architecture for horizontal scaling
- Database connection pooling
- CDN integration for static assets
- Monitoring and alerting setup

## Security Considerations

### Authentication Flow
1. User signs in with Google via NextAuth.js
2. OAuth flow includes Calendar API scope
3. Tokens stored securely in PostgreSQL
4. Session management via database-backed sessions

### Data Protection
- All sensitive data encrypted at rest
- API endpoints protected with session validation
- Rate limiting on all public endpoints
- Input sanitization and validation
- CORS policies properly configured

### Error Handling Strategy
- Graceful degradation for AI service failures
- User-friendly error messages
- Comprehensive logging and monitoring
- Recovery procedures for common failures

## Notes

### Template Benefits
- Pre-configured authentication with Google OAuth
- Database setup with Prisma migrations
- Testing framework with Jest and Playwright
- Production-ready middleware and security
- Material UI components for rapid development

### Key Implementation Decisions
- Single comprehensive AI prompt vs. multiple parallel calls for consistency
- Database-backed sessions for security vs. JWT for performance
- Background job processing vs. real-time processing for novel events
- Direct Calendar API integration vs. third-party calendar libraries

### Future Considerations
- Multi-calendar support will require extended OAuth scopes
- Advanced AI features may need fine-tuned models
- Team features would require multi-tenant architecture
- Mobile app would benefit from the existing API structure
# Scratchpad - Work Phase

**NOTES:**

- All To Do items should be added as checklists.
- Do not check something off unless you're confident it's complete.
- Reorganize now and then, putting unfinished tasks at the top and finished ones at the bottom.

## Current Story

**Story 004**: Implement OpenAI text processing service  
**Status**: To Do  
**Link**: /docs/stories/story-004-openai-service.md

## Current Task

Setting up OpenAI API integration and implementing the core text-to-calendar event extraction service using GPT-4

## Plan Checklist

### Story 004 Tasks

- [ ] Set up OpenAI API account and obtain API key
- [ ] Configure `OPENAI_API_KEY` in environment variables
- [ ] Install OpenAI SDK package (`npm install openai`)
- [ ] Create `lib/ai.ts` service module
- [ ] Define `ExtractedEventData` TypeScript interface with confidence scores
- [ ] Implement `AIProcessingService` class with core methods
- [ ] Design comprehensive system prompt for event extraction
- [ ] Implement `extractEventDetails()` method with GPT-4 integration
- [ ] Add timezone context to prompt generation
- [ ] Implement field-level confidence scoring
- [ ] Add validation and enhancement logic for extracted data
- [ ] Create error handling for API failures and rate limits
- [ ] Add input sanitization and safety checks
- [ ] Implement retry logic with exponential backoff
- [ ] Create unit tests for core processing functions
- [ ] Test with various natural language inputs
- [ ] Optimize prompt engineering for accuracy and consistency
- [ ] User must sign off on functionality before story can be marked complete

## Issues/Blockers

- Need OpenAI API key to proceed

## Recently Completed

### Story 003: Set up database schema for users ✅ COMPLETE

- [x] Database schema already complete from NextAuth.js template
- [x] Users, Accounts, Sessions tables properly configured
- [x] Indexes and relationships properly set up

### Story 002: Configure Google OAuth & Calendar API ✅ COMPLETE

- [x] Google Cloud Console project configured
- [x] Google Calendar API enabled
- [x] OAuth 2.0 credentials configured
- [x] NextAuth.js Google provider with Calendar scope
- [x] OAuth flow tested and working
- [x] User sign-off ✅ CONFIRMED WORKING

### Story 001: Set up project from template ✅ COMPLETE

- [x] Complete template integration with NextAuth.js + PostgreSQL stack
- [x] All dependencies installed and configured
- [x] Database and Redis connections working
- [x] Authentication UI functional
- [x] User sign-off ✅ CONFIRMED WORKING

## Decisions Made

- Using PM2 for local development server management
- Database naming convention: ai-calendar-helper-dev (hyphenated format)
- Template integration approach: git remote merge to preserve project identity
- Redis enabled for rate limiting and caching
- Google OAuth with Calendar API scope successfully configured
- Database schema from template is sufficient for current needs

## Lessons Learned

- Template setup scripts require careful regex escaping for JSX placeholder replacement
- Critical to maintain .gitignore integrity when merging templates
- PM2 server management provides stable development environment for AI assistance
- User confirmation via screenshot is valuable for verifying UI functionality
- Google OAuth integration was already working from template
- NextAuth.js template provides complete user management database schema

Keep this file concise (<300 lines): summarize or remove outdated info regularly to prevent overloading the context. Focus on the current phase and immediate next steps.

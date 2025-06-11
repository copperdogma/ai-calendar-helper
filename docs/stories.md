# Project Stories

AI Calendar Helper

**START CRITICAL NOTES -- DO NOT REMOVE**

- This document serves as an index for all story files in `/docs/stories/`, tracking their progress and status.
- Keep this document formatted according to `stories-template.md`
- Should we transition to the next phase? `scratchpad.mdc` will explain what script to run to do that.
  **END CRITICAL NOTES -- DO NOT REMOVE**

---

## Story List

### Phase 1: Foundation & Authentication (Priority: Critical)

| Story ID | Title                                 | Priority | Status | Link                                       |
| -------- | ------------------------------------- | -------- | ------ | ------------------------------------------ |
| 001      | Set up project from template          | Critical | To Do  | /docs/stories/story-001-setup-project.md   |
| 002      | Configure Google OAuth & Calendar API | Critical | To Do  | /docs/stories/story-002-configure-oauth.md |
| 003      | Set up database schema for users      | Critical | To Do  | /docs/stories/story-003-setup-database.md  |

### Phase 2: Text-to-Calendar Feature (Priority: High)

| Story ID | Title                                    | Priority | Status | Link                                            |
| -------- | ---------------------------------------- | -------- | ------ | ----------------------------------------------- |
| 004      | Implement OpenAI text processing service | High     | To Do  | /docs/stories/story-004-openai-service.md       |
| 005      | Create text input UI component           | High     | To Do  | /docs/stories/story-005-text-input-ui.md        |
| 006      | Build event preview & editing component  | High     | To Do  | /docs/stories/story-006-event-preview.md        |
| 007      | Implement Google Calendar integration    | High     | To Do  | /docs/stories/story-007-calendar-integration.md |
| 008      | Add ICS file generation & download       | Medium   | To Do  | /docs/stories/story-008-ics-generation.md       |

### Phase 3: Novel Events Extraction (Priority: Medium)

| Story ID | Title                                    | Priority | Status | Link                                           |
| -------- | ---------------------------------------- | -------- | ------ | ---------------------------------------------- |
| 009      | Design novel events filtering logic      | Medium   | To Do  | /docs/stories/story-009-novel-events-filter.md |
| 010      | Create background job system             | Medium   | To Do  | /docs/stories/story-010-background-jobs.md     |
| 011      | Build email template & delivery service  | Medium   | To Do  | /docs/stories/story-011-email-service.md       |
| 012      | Create configuration UI for novel events | Medium   | To Do  | /docs/stories/story-012-config-ui.md           |

### Phase 4: UI/UX & Polish (Priority: Low-Medium)

| Story ID | Title                              | Priority | Status | Link                                         |
| -------- | ---------------------------------- | -------- | ------ | -------------------------------------------- |
| 013      | Implement main dashboard layout    | Medium   | To Do  | /docs/stories/story-013-dashboard-layout.md  |
| 014      | Add error handling & user feedback | Medium   | To Do  | /docs/stories/story-014-error-handling.md    |
| 015      | Create user settings & preferences | Low      | To Do  | /docs/stories/story-015-user-settings.md     |
| 016      | Implement timezone handling        | Medium   | To Do  | /docs/stories/story-016-timezone-handling.md |

### Phase 5: Testing & Deployment (Priority: Medium)

| Story ID | Title                                   | Priority | Status | Link                                  |
| -------- | --------------------------------------- | -------- | ------ | ------------------------------------- |
| 017      | Write unit tests for core functionality | Medium   | To Do  | /docs/stories/story-017-unit-tests.md |
| 018      | Implement E2E testing with Playwright   | Medium   | To Do  | /docs/stories/story-018-e2e-tests.md  |
| 019      | Set up fly.io deployment pipeline       | Medium   | To Do  | /docs/stories/story-019-deployment.md |
| 020      | Configure monitoring & error tracking   | Low      | To Do  | /docs/stories/story-020-monitoring.md |

## Priority Definitions

- **Critical**: Must be completed for basic functionality
- **High**: Core features required for MVP
- **Medium**: Important features that enhance user experience
- **Low**: Nice-to-have features for future releases

## Dependencies

- Stories 001-003 must be completed before any other work can begin
- Stories 004-008 (Text-to-Calendar) should be completed before stories 009-012 (Novel Events)
- Story 002 (OAuth setup) is a dependency for both story 007 (Calendar integration) and story 009 (Novel events filtering)
- Testing stories (017-018) should be implemented alongside feature development
- Deployment story (019) requires completion of core features

## Success Metrics

- **Text-to-Calendar**: User can input natural language text and create calendar events with 90%+ accuracy
- **Novel Events**: User receives useful email summaries of upcoming unique events
- **Performance**: Text processing completes within 5 seconds
- **User Experience**: Minimal clicks required from text input to calendar event creation

## Notes

- Phase 1 stories are critical path items - all other work depends on these
- Text-to-Calendar feature (stories 004-008) represents the primary value proposition
- Novel Events feature (stories 009-012) is secondary but provides unique differentiating value
- UI polish and testing can be developed in parallel with core features
- Each story includes detailed acceptance criteria and links to requirements/design docs

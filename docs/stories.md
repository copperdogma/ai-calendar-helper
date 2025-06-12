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
| 001      | Set up project from template          | Critical | Done   | /docs/stories/story-001-setup-project.md   |
| 002      | Configure Google OAuth & Calendar API | Critical | Done   | /docs/stories/story-002-configure-oauth.md |
| 003      | Set up database schema for users      | Critical | Done   | /docs/stories/story-003-setup-database.md  |

### Phase 2: Text-to-Calendar Feature (Priority: High)

| Story ID | Title                                            | Priority | Status   | Link                                            |
| -------- | ------------------------------------------------ | -------- | -------- | ----------------------------------------------- |
| 005      | Create text input UI component                   | High     | Done     | /docs/stories/story-005-text-input-ui.md        |
| 004      | Implement OpenAI text processing service         | High     | Done     | /docs/stories/story-004-openai-service.md       |
| 006      | Build event preview & editing component          | High     | Done     | /docs/stories/story-006-event-preview.md        |
| 007      | Add calendar integration buttons                 | High     | Done     | /docs/stories/story-007-calendar-integration.md |
| 008      | Add ICS file generation & download               | Medium   | Done     | /docs/stories/story-008-ics-generation.md       |
| 009      | Implement confidence scoring display             | Medium   | Done     | /docs/stories/story-009-confidence-scoring.md   |
| 010      | Add batch calendar actions                       | Medium   | Planning | /docs/stories/story-010-batch-actions.md        |
| 011      | Create smart defaults & preferences              | Medium   | To Do    | /docs/stories/story-011-user-preferences.md     |
| 012      | Implement timezone detection/selection           | Medium   | To Do    | /docs/stories/story-012-timezone-handling.md    |
| 035      | Enhance AI parsing for multiple events           | High     | To Do    | /docs/stories/story-035-multi-event-parsing.md  |
| 032      | Implement Calendar Parser page & default routing | High     | Done     | /docs/stories/story-032-calendar-parser-page.md |

### Phase 3: UX Enhancements (Priority: Medium)

| Story ID | Title                                      | Priority | Status | Link                                          |
| -------- | ------------------------------------------ | -------- | ------ | --------------------------------------------- |
| 013      | Add conflict detection for existing events | Medium   | To Do  | /docs/stories/story-013-conflict-detection.md |
| 014      | Implement comprehensive error handling     | Medium   | To Do  | /docs/stories/story-014-error-handling.md     |
| 015      | Create empty state & usage examples        | Low      | To Do  | /docs/stories/story-015-empty-state.md        |
| 016      | Add mobile responsive design               | Medium   | To Do  | /docs/stories/story-016-mobile-responsive.md  |
| 017      | Implement keyboard shortcuts               | Low      | Done   | /docs/stories/story-017-keyboard-shortcuts.md |

### Phase 4: Novel Events Extraction (Priority: Medium)

| Story ID | Title                                    | Priority | Status | Link                                           |
| -------- | ---------------------------------------- | -------- | ------ | ---------------------------------------------- |
| 019      | Design novel events filtering logic      | Medium   | To Do  | /docs/stories/story-019-novel-events-filter.md |
| 020      | Create background job system             | Medium   | To Do  | /docs/stories/story-020-background-jobs.md     |
| 021      | Build email template & delivery service  | Medium   | To Do  | /docs/stories/story-021-email-service.md       |
| 022      | Create configuration UI for novel events | Medium   | To Do  | /docs/stories/story-022-config-ui.md           |

### Phase 5: UI/UX & Polish (Priority: Low-Medium)

| Story ID | Title                                   | Priority | Status | Link                                         |
| -------- | --------------------------------------- | -------- | ------ | -------------------------------------------- |
| 023      | Implement main dashboard layout         | Medium   | To Do  | /docs/stories/story-023-dashboard-layout.md  |
| 024      | Add JSON export & API integration       | Low      | To Do  | /docs/stories/story-024-json-export.md       |
| 025      | Create user settings & preferences      | Low      | To Do  | /docs/stories/story-025-advanced-settings.md |
| 033      | Update About page with project overview | Medium   | To Do  | /docs/stories/story-033-update-about-page.md |

### Phase 6: Testing & Deployment (Priority: Medium)

| Story ID | Title                                   | Priority | Status | Link                                  |
| -------- | --------------------------------------- | -------- | ------ | ------------------------------------- |
| 026      | Write unit tests for core functionality | Medium   | Done   | /docs/stories/story-026-unit-tests.md |
| 027      | Implement E2E testing with Playwright   | Medium   | Done   | /docs/stories/story-027-e2e-tests.md  |
| 028      | Set up fly.io deployment pipeline       | Medium   | To Do  | /docs/stories/story-028-deployment.md |
| 029      | Configure monitoring & error tracking   | Low      | To Do  | /docs/stories/story-029-monitoring.md |

### Phase 7: Optimization & Research (Priority: Medium)

| Story ID | Title                                                                 | Priority | Status | Link                                             |
| -------- | --------------------------------------------------------------------- | -------- | ------ | ------------------------------------------------ |
| 030      | Research optimal AI model for calendar parsing                        | Medium   | Done   | /docs/stories/story-030-model-optimization.md    |
| 031      | Location parsing and map integration                                  | High     | To Do  | /docs/stories/story-031-location-parsing-maps.md |
| 034      | Easier service entry points (browser plugin, shortcut, phone service) | Medium   | To Do  | /docs/stories/story-034-entry-points.md          |

### Phase 8: Prompt Refinement (Priority: Medium)

| Story ID | Title                     | Priority | Status   | Link                                                 |
| -------- | ------------------------- | -------- | -------- | ---------------------------------------------------- |
| 036      | Prompt Refinement Harness | Medium   | Planning | /docs/stories/story-036-prompt-refinement-harness.md |

## Priority Definitions

- **Critical**: Must be completed for basic functionality
- **High**: Core features required for MVP
- **Medium**: Important features that enhance user experience
- **Low**: Nice-to-have features for future releases

## Dependencies

- Stories 001-003 must be completed before any other work can begin
- Stories 004-008 (Text-to-Calendar) should be completed before stories 009-012 (Novel Events)
- Story 002 (OAuth setup) is a dependency for both story 007 (Calendar integration) and story 009 (Novel events filtering)
- Testing stories (026-027) should be implemented alongside feature development
- Deployment story (028) requires completion of core features

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

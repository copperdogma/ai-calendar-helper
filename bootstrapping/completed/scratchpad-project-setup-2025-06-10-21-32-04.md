# Scratchpad - Planning Phase

@scratchpad.md already exists and is your external memory. Use it to help you stay on track.

**Current Phase**: Planning

**Planning Phase Tasks**
- [x] Create design document:
  - [x] Use `/docs/templates/design-template.md` to create `/docs/design.md` ✓ (User restored comprehensive design)
  - [x] Discuss imagined workflow with user to get a sense of it ✓ (Already documented)
  - [x] Ensure alignment with requirements ✓ (Updated for NextAuth.js template)
  - [x] Include UI/UX considerations if applicable ✓
  - [x] Document key design decisions ✓
- [x] Create architecture document:
  - [x] Use `/docs/templates/architecture-template.md` to create `/docs/architecture.md` ✓
  - [x] Define system components and their interactions ✓
  - [x] Specify technologies and frameworks ✓
  - [x] Document architectural decisions and trade-offs ✓
- [x] Extract and move content from the "Non-Requirements Detail" section of `requirements.md`:
  - [x] Review `/docs/requirements.md` for implementation details ✓ (No such section exists)
  - [x] Move relevant details to the appropriate design or architecture document ✓ (N/A)
  - [x] Remove the section from requirements.md after ensuring all details are captured ✓ (N/A)
- [x] Create user stories:
  - [x] Use `/docs/templates/stories-template.md` to create `/docs/stories.md` ✓
  - [x] Break down requirements into implementable stories ✓
  - [x] Prioritize stories based on dependencies and importance ✓
  - [x] Ensure everything from `docs/requirements.md`, `docs/design.md`, and `docs/architecture.md` is covered by a story ✓
  - [x] Add a task item in this document for each story added to stories.md ✓
- [ ] For each user story:
  - [x] Story 001: Set up project from template ✓
  - [x] Story 002: Configure Google OAuth & Calendar API ✓
  - [x] Story 004: Implement OpenAI text processing service ✓
  - [ ] Story 003: Set up database schema for users
  - [ ] Story 005: Create text input UI component
  - [ ] Story 006: Build event preview & editing component
  - [ ] Story 007: Implement Google Calendar integration
  - [ ] Story 008: Add ICS file generation & download
  - [ ] Story 009: Design novel events filtering logic
  - [ ] Story 010: Create background job system
  - [ ] Story 011: Build email template & delivery service
  - [ ] Story 012: Create configuration UI for novel events
  - [ ] Story 013: Implement main dashboard layout
  - [ ] Story 014: Add error handling & user feedback
  - [ ] Story 015: Create user settings & preferences
  - [ ] Story 016: Implement timezone handling
  - [ ] Story 017: Write unit tests for core functionality
  - [ ] Story 018: Implement E2E testing with Playwright
  - [ ] Story 019: Set up fly.io deployment pipeline
  - [ ] Story 020: Configure monitoring & error tracking
  - [ ] Use `/docs/templates/story-template.md` to create individual story files (e.g., `/docs/stories/story-001.md`), pulling from the `docs/requirements.md`, `docs/design.md`, and `docs/architecture.md` for details
  - [ ] Ensure each story has clear acceptance criteria
  - [ ] Link stories to requirements and design documents
  - [ ] For each user story, validate the contents against the `docs/requirements.md`, `docs/design.md`, and `docs/architecture.md` documents to ensure all requirements are covered, the story isn't inventing requirements, and the story makes sense.
  - [ ] Check in what we have so far to github (if the project is using github).


**Transition to Next Phase**
- When all planning tasks are complete, ask the user: "Are you ready to move to the Project Setup phase?"
- If yes, run: `./bootstrapping/scripts/transition_to_execute.sh programming project-setup`
  - This will copy all files to the correct places to start the Project Setup phase

**User Input**  
- [Log key user decisions and feedback here]

**Quick Start Assumptions**  
- [If quick start is used, list assumptions made, e.g., "Assumed minimal UI based on requirements."]

**Issues or Blockers**  
- [Note anything preventing progress]

**Decisions Made**
- Chose NextAuth.js + PostgreSQL + Redis template as foundation
- Updated design to align with template architecture (Firebase → NextAuth.js)
- Created comprehensive architecture document with database schema
- Prioritized 20 user stories across 5 phases
- Focused on MVP features first (Text-to-Calendar primary, Novel Events secondary)
- Critical path: Stories 001-003 must be completed before other work can begin
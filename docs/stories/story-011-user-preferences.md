# Story 011: Create Smart Defaults & User Preferences

**Status**: 🟡 **PLANNING** – Story defined, implementation not started

---

## Overview

Users should be able to configure personal defaults that streamline event creation and parsing. Typical examples include preferred meeting duration, working hours, date/time formatting, and whether newly-parsed events default to busy or free. These preferences must persist per-user, surface in the UI, and feed into the AI parsing pipeline so extracted events honour the user's choices.

## Related Requirements

- [Requirement #2: Personalisation](../requirements.md#personalisation)
- [Requirement #3: AI Text Processing](../requirements.md#ai-text-processing)

## Alignment with Design

- [Design §4.1: User Settings & Preferences](../design.md#user-settings--preferences)
- [Design §3.2: AI Service Architecture](../design.md#ai-service-architecture) – preferences are injected into the `AIProcessingOptions` object.

## Problem Statement

Today the service uses hard-coded defaults (60-minute duration, UTC timezone, etc.). This leads to friction and incorrect assumptions. We need a systematic way for users to set and persist sensible defaults that the application respects everywhere.

## Acceptance Criteria

- [ ] **DB schema**: A `user_preferences` table (Prisma model) linked 1-to-1 with `User`.
- [ ] **Fields**
  - `defaultDuration` (int, minutes)
  - `workingHoursStart`/`workingHoursEnd` (HH:mm)
  - `busyByDefault` (boolean)
  - Future-proof JSON `meta` column for additional settings
- [ ] **API**: REST/JSON endpoints (or Next.js route handlers) to fetch & update the preference record, protected by session auth.
- [ ] **UI**: `/settings` page with a **Preferences** section allowing users to view & edit the above fields.
- [ ] **Validation**: Client & server-side validation with Zod (duration >0, hours 0-24, etc.).
- [ ] **AI integration**: When present, preferences are passed from the frontend to `/api/ai/parse-events` and honoured in `lib/ai.ts` (already partially wired for `defaultDuration`).
- [ ] **Tests**
  - Prisma model unit test
  - API route tests (auth, validation, happy path)
  - React component tests for the settings form
  - E2E flow: update preferences → parse text → verify defaults applied
- [ ] **Accessibility**: Settings form meets WCAG AA.
- [ ] **Docs**: Update README and `/docs/design.md` with preference model details.

## Tasks

1. Design Prisma model & generate migration _(simple)_
2. Add Prisma helper functions (`getOrCreatePreferences`, `updatePreferences`)
3. Implement `/api/preferences/[GET|PUT]` routes _(moderate)_
4. Create `SettingsLayout` and `PreferencesForm` components _(moderate)_
5. Wire data fetching via React Query / SWR
6. Extend `AIProcessingOptions` plumbing (frontend -> API) to include full `userPreferences` object _(simple)_
7. Write unit & integration tests _(complex)_
8. Update documentation & story status

## Risks & Mitigations

| Risk                                         | Impact | Mitigation                             |
| -------------------------------------------- | ------ | -------------------------------------- |
| Partial updates could overwrite unset values | Medium | Use PATCH semantics or merge-on-update |
| Migration clashes with production data       | Low    | Create idempotent migration & backup   |
| User confusion with too many settings        | Medium | Start with MVP fields, use helper text |

## Success Metrics

- ≥95 % of parses reflect user-selected `defaultDuration` in unit tests
- Settings page Lighthouse accessibility score ≥90
- E2E test passes on CI

## Open Questions

1. Should working hours influence suggested times (future feature)?
2. Where in the UI should "busy by default" surface? (Event preview badge?)

---

_Created {{DATE}}_

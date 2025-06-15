# Story 012: Implement Timezone Detection & Selection

**Status**: 🟡 **PLANNING** – Auto-detection complete, user selection not yet implemented

---

## Overview

The application currently detects the browser's timezone and sends it to the backend, ensuring parsed events use local offsets. However, users cannot override this value or persist a preferred timezone (e.g. when planning travel). This story completes the timezone feature by adding selection, persistence, and consistent display across the UI.

## Related Requirements

- [Requirement #2: Personalisation](../requirements.md#personalisation)
- [Requirement #3: AI Text Processing](../requirements.md#ai-text-processing)

## Alignment with Design

- [Design §4.1: User Settings & Preferences](../design.md#user-settings--preferences)
- [Design §3.3: Date/Time Handling](../design.md#date-time-handling)

## Problem Statement

Auto-detecting timezone works for most cases but fails when users:

1. Plan events in a future location (travel)
2. Use devices configured to a different zone than their desired calendar zone
3. Need to preview events in collaborators' zones

Providing a manual override enhances flexibility and correctness.

## Acceptance Criteria

- [ ] **UI – Settings Page**
  - A dropdown (searchable) listing IANA timezones with current offset
  - Shows detected timezone by default
  - Persist button saves selection
- [ ] **Persistence**
  - New `timezone` field in `user_preferences` (Story 011 dependency)
  - Saved via the existing /api/preferences route
- [ ] **Runtime Usage**
  - `Intl.DateTimeFormat().resolvedOptions().timeZone` used as **fallback** when no preference stored
  - All API calls pass `timezone` from preferences (or fallback) in `options`
  - All date rendering helpers/components use `timeZone` prop value
- [ ] **Edge Cases**
  - Invalid / deprecated timezone strings rejected with clear error
  - Switching preference triggers re-render with new offsets
- [ ] **Tests**
  - Unit: timezone validation util
  - Integration: preference flow
  - E2E: change timezone, parse "4 pm" → expect converted time
- [ ] **Docs**: Update README and user guide sections on timezone management

## Tasks

1. Create `timezoneOptions.ts` util exporting array of `(label, value, offset)` _(simple)_
2. Add `timezone` column to `user_preferences` Prisma model _(simple)_
3. Extend settings form with `TimezonePicker` component _(moderate)_
4. Implement server-side validation with Zod _(simple)_
5. Update client helpers & context provider to expose active timezone _(moderate)_
6. Ensure `app/calendar-parser`, dashboard, and ICS generation honour preference _(moderate)_
7. Write tests _(complex)_

## Risks & Mitigations

| Risk                                      | Impact | Mitigation                                         |
| ----------------------------------------- | ------ | -------------------------------------------------- |
| Large timezone list affects bundle size   | Low    | Lazy-load data or code-split component             |
| User selects wrong zone accidentally      | Medium | Show offset preview and current time sample        |
| Timezone differences cause date math bugs | Medium | Use `luxon` or `Intl` APIs consistently, add tests |

## Success Metrics

- User can switch timezone and see example time update immediately
- At least one E2E test verifies cross-timezone parsing correctness
- No regressions in existing unit tests

## Open Questions

1. Should we allow per-event timezone overrides in the event preview modal?
2. Do we need to expose GMT offsets alongside IANA names in dropdown?

---

_Created {{DATE}}_

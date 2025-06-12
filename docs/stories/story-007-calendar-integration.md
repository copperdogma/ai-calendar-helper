# Story: Add Calendar Integration Buttons

**Status**: In Progress

---

## Related Requirement

[Requirement TBD: Calendar Integration UX](/docs/requirements.md)

## Alignment with Design

[Design Section: Event Cards & Actions](/docs/design.md#event-cards)

## Acceptance Criteria

- Each `EventPreviewCard` displays three "Add to Calendar" buttons (Google, Outlook, Apple).
- Buttons open the correct provider URL or download an `.ics` file without requiring user sign-in.
- Buttons have accessible `aria-label`s and MUI `Tooltip`s.
- Responsive layout: buttons remain touch-friendly (≥44 × 44 px) and wrap on narrow screens.
- Utility function `generateAddToCalendarLinks` exists in `lib/utils/calendarLinks.ts` and is unit-tested.
- No OAuth or external API keys are required.
- All existing unit tests pass; new tests cover the utility and card rendering.
- Story must be signed off by the user.

## Tasks

- [ ] Create `calendarLinks.ts` utility with URL builders and ICS generator.
- [ ] Write unit tests `calendarLinks.test.ts` verifying URL formats & ICS content.
- [ ] Install / select suitable MUI icons (Google, Outlook, Apple fallback).
- [ ] Update `components/calendar/EventPreviewCard.tsx` to render buttons in non-edit mode.
- [ ] Ensure accessible labels/tooltips and responsive styling.
- [ ] Update snapshots & fix any failing tests.
- [ ] Run lint & tests (`npm run validate`).
- [ ] Update documentation/examples if necessary.
- [ ] User sign-off.

## Notes (Research & Decisions)

### Research Summary

- Best-practice for lightweight calendar integration is provider-specific deep links plus an `.ics` fallback for Apple Calendar; this avoids OAuth complexity.
- Google & Outlook accept URL parameters (`action=TEMPLATE`, `dates`, `subject`, etc.).
- Apple Calendar lacks a URL scheme; the recommended approach is to serve an `.ics` file with correct `DTSTART`, `DTEND`, `SUMMARY`, etc. We will generate the file client-side and trigger a download via a data-URI.
- Including `TZID` (or using UTC) prevents time-zone drift.
- Security: because we do not call provider APIs, no special permissions are needed. Users grant consent by adding the event manually after the link/file opens.
- UI guidelines recommend icon buttons with tooltips, ≥44 px tap area, and accessible labels.

### Key Decisions

1. Implement **only** quick "Add to Calendar" links/files—no authenticated calendar write.
2. Links/files will be generated on the fly in the browser; no backend endpoints are required.
3. Accessibility and mobile-friendliness are first-class requirements.

---

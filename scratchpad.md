# AI Calendar Helper - Work Phase Scratchpad

## NEXT:

- ensure the add-to-calendar buttons add ALL the data, not just the summaries. Include the full description from the original text
- Calendar browser plugin? Shortcut? Phone service?

## Current Phase: Building

## Add Calendar Integration Buttons Research & Planning Checklist

- [x] Initial research questions identified
- [x] Web research completed
- [x] Codebase analysis completed
- [x] Best practices identified
- [x] Implementation strategy developed
- [x] Detailed implementation checklist created
- [x] User preference questions identified and asked
- [ ] Plan reviewed and approved by user

## User Preferences for Calendar Integration Buttons

- Providers: Google Calendar, Outlook, Apple Calendar
- Placement: Each event card
- Design: Clean and obvious (no strict branding requirements)
- Responsiveness: Support desktop and mobile

## Initial Research Questions

1. What are the standard methods for generating "Add to Calendar" links or files for Google, Outlook, and Apple?
2. Should we use direct webcal/ics file downloads, provider-specific URL schemes, or third-party libraries?
3. How to handle time zone information to ensure events import correctly across providers?
4. What permissions or security considerations apply when linking to external calendar providers (e.g., OAuth scopes vs. static files)?
5. What UI patterns (icon + label, tooltip, etc.) are recommended for add-to-calendar buttons?
6. How to keep buttons accessible and keyboard navigable while fitting within existing EventPreviewCard layout?
7. Are there existing React or MUI components/libraries that simplify building these buttons?

### Web Research Highlights

- Common approach: "Add to Calendar" LINKS rather than API integrations to avoid OAuth complexity and work without extra permissions. Works by opening a provider-specific URL (Google, Outlook) or downloading an ICS file (Apple).
- Provider-specific URLs:
  - Google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=<TITLE>&dates=<START>/<END>&details=<DESC>&location=<LOC>`
  - Outlook / Office365 / Outlook.com: `https://outlook.office.com/calendar/0/deeplink/compose?...&startdt=<ISO>&enddt=<ISO>&subject=<TITLE>&body=<DESC>&location=<LOC>`
- Apple Calendar has no URL scheme; best practice is serve an `.ics` file with correct DTSTART, DTEND, SUMMARY, DESCRIPTION, LOCATION, and TZID.
- Time-zone accuracy: include `TZID` or use UTC in links; ensure times converted correctly.
- Security/Permissions: Using provider URLs or ICS file requires **no** OAuth scopes. Users grant permission manually when they save the event. Full write-access integrations WOULD require OAuth (Google Calendar API, Microsoft Graph) with `calendar.events` scopes.
- Accessibility/UI: place three icon buttons (Google, Outlook, Apple) with visually hidden accessible labels (`aria-label`). Use MUI `IconButton` + tooltip. Ensure 44×44 hit area on mobile.
- Mobile/desktop: Provider links open in browser; iOS will prompt to open Calendar when tapping `.ics` link.

### Codebase Analysis Notes

- Event card component is `components/calendar/EventPreviewCard.tsx` (renders each card).
- Cards currently show edit icon only—we will append three `IconButton`s for calendar providers within the non-edit view.
- Event data shape: title, date (YYYY-MM-DD or relative string), time (HH:mm), location, description.
- No timezone field yet; we will assume local timezone initially; future enhancement could add.

### Best Practices & Decisions

1. Use provider-specific URL for Google and Outlook; generate `.ics` file for Apple.
2. Generate URLs on the fly inside card (no API key needed).
3. Provide accessible tooltips and labels; icons from MUI `Google`, `Outlook`, and `Apple` (use generic `CalendarToday` if Apple icon missing).
4. Expose helper `buildAddToCalendarLinks(event)` in `lib/utils/calendarLinks.ts` for reusability.
5. Keep external link opening in new tab with `rel="noopener noreferrer" target="_blank"`.
6. For ICS, create blob client-side and trigger download using `<a href="data:text/calendar,..." download="event.ics">`.
7. Ensure buttons visually align in card footer; responsive stacking on mobile via `flex-wrap`.

### Implementation Strategy

1. Create utility `lib/utils/calendarLinks.ts`:
   - Function `generateAddToCalendarLinks(event: {title, date, time?, location?, description?}): { google: string; outlook: string; ics: string }`
   - For Google & Outlook, return formatted URLs.
   - For Apple, return ICS content string (caller converts to `data:text/calendar;charset=utf-8,` URI).
2. Modify `EventPreviewCard`:
   - In non-edit view, add new `Box` with three `IconButton`s (Google, Outlook, Apple download).
   - Each button uses link from util; Apple button triggers download via link with `href` pointing to encoded ICS.
3. Add icons: Use `CalendarMonth` (fallback), or install `simple-icons` if needed; initial use generic icons with provider-colored backgrounds if simple.
4. Add unit tests for util to verify URL formatting.
5. Add storybook story (optional) for card with buttons.
6. Update tests.

### Detailed Implementation Checklist

- [x] Create `calendarLinks.ts` util with helper functions.
- [x] Write unit tests in `tests/unit/utils/calendarLinks.test.ts`.
- [x] Install any missing icon dependencies or use existing MUI icons.
- [x] Update `EventPreviewCard.tsx` to import util and render buttons.
- [x] Ensure buttons have `aria-label` and tooltips.
- [x] Verify responsive layout: wrap icons within `Box` align items center.
- [x] Update jest snapshots if needed.
- [x] Run `npm run lint` and `npm test` to confirm pass.
- [ ] Document new utility in `/docs/examples/` if required.

- [ ] Plan reviewed and approved by user

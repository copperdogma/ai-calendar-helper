# AI Calendar Helper - Work Phase Scratchpad

## NEXT:

- Review and prioritize newly created Story 032 (Calendar Parser page) and Story 033 (About page update).

## Current Phase: Building

## Build Event Preview & Editing Component Research & Planning Checklist

- [x] Initial research questions identified
- [ ] Web research completed
- [ ] Codebase analysis completed
- [ ] Best practices identified
- [ ] Implementation strategy developed
- [ ] Detailed implementation checklist created
- [x] User preference questions identified and asked
- [ ] Plan reviewed and approved by user

### User Preferences (Captured 2025-06-11)

- Layout: keep current layout (input top, results list below)
- Editing style: quick-edit inline for Title, Date/Time, Location, Confidence
- Fields visible: Title, Date/Time, Location, Confidence, plus one-line summary of remaining details (invitees count, description)
- UI Library: Material UI only
- Event list ordering: sequential list of parsed events as they appear
- Dark mode: yes, full support

## Current Story: Story 006 - Build Event Preview & Editing Component

**Status**: 🚧 **IN PROGRESS** - Research & Planning phase initiated for Story 006

### Best Practices (Material UI & Inline Editing)

- Leverage MUI `Card` or `Paper` with `sx` prop and theme palette (`backgroundColor: 'background.paper'`, `action.hover` for hover) to ensure automatic dark-mode friendliness.
- Avoid DataGrid for simple lists; custom card list is lighter and avoids pro tier dependency.
- Use `TextField` with `variant="standard"` or `filled` inside edit state for minimal height.
- `DateTimePicker` from `@mui/x-date-pickers` provides native dark-mode styling; wrap within `LocalizationProvider` at app root.
- Keep state local in the card for immediate UX; propagate via `onUpdate` callback to parent list.
- Use `IconButton` with `Edit`, `Save`, `Cancel` icons for quick-edit toggling.
- Maintain accessibility: aria-labels on edit buttons, form elements.
- Responsive Stack/Grid layout: stack vertically on xs, inline on sm+.

### Implementation Strategy

1. **Component Hierarchy**
   - `EventPreviewList` (receives `events`, renders multiple `EventPreviewCard`).
   - `EventPreviewCard` (displays preview, quick-edit toggle).
2. **State Flow**
   - Parent (`TextInputForm`) holds `events` array.
   - Child card emits `onUpdate(updatedEvent)`; parent merges state.
3. **Styling**
   - Use theme spacing; avoid hard-coded colors.
   - Dark-mode compatibility via theme palette.
4. **Testing**
   - Unit tests for render & edit interactions;
   - E2E adjustment to validate editing flow.
5. **Incremental Integration**
   - Build components in isolation (Storybook style tests) then replace current simple results display.

### Detailed Implementation Checklist

- [x] Create `components/calendar/EventPreviewCard.tsx` (view & edit modes).
- [x] Create `components/calendar/EventPreviewList.tsx` that maps over events.
- [x] Update `components/calendar/TextInputForm.tsx` to import and use list component.
- [ ] Add `onUpdateEvent` handler in `TextInputForm` to update state.
- [x] Implement quick-edit fields: Title (TextField), Date/Time (DateTimePicker), Location (TextField).
- [x] Add ESC key to cancel edit.
- [x] Adjust save icon and cancel button position.
- [ ] Show confidence badge (Typography variant="caption").
- [ ] Render one-line summary (description + invitees count) truncated to 80 chars.
- [ ] Theme-aware styling & dark mode tests.
- [ ] Unit tests with React Testing Library (render, edit, save, cancel).
- [ ] Update E2E test to parse sample text, edit title, verify change.
- [ ] Documentation update in Story 006 notes.
- [ ] Peer review / lint / type-check.
- [ ] User approval and mark Story complete.
- [x] Write unit tests with React Testing Library & Jest.
- [ ] Add Enter key to save and tweak AM/PM picker.
- [ ] Cmd/Ctrl+Enter triggers Parse Events; caret at end when editing title; revert AM/PM view.

# Story: Build Event Preview & Editing Component

**Status**: In Progress

---

## Related Requirement

<!-- TODO: Link to requirement when requirements.md section added -->

[Pending requirement link]

## Alignment with Design

See [Design.md – Event Preview Card (Simplified)](../design.md#event-preview-card-simplified)

## Acceptance Criteria

- Users see a sequential list of parsed events directly under the input area.
- Each event preview card displays Title, Date/Time, Location, Confidence, and a one-line summary (e.g., "3 invitees • Dinner at Giovanni's").
- Inline quick-edit enables updating Title, Date/Time, and Location without leaving the list view.
- Editing uses Material-UI components and supports dark mode.
- Changes update local event state immediately; persisted when user commits (e.g., "Add to Calendar" later story).
- Component fully responsive on mobile and desktop.
- Unit tests cover rendering, editing interactions, and dark-mode styling (≥90% coverage for component file).
- Story must satisfy design guidelines and pass existing lint, type, and test suites.
- [ ] User must sign off on functionality before story can be marked complete.

## Tasks

- [ ] Research best practices for inline editable list items with MUI.
- [ ] Design component structure (EventList → EventCard → QuickEditFields).
- [ ] Implement `EventPreviewList` component housing individual `EventPreviewCard`s.
- [ ] Add quick-edit fields for Title, Date/Time (MUI DateTimePicker), Location.
- [ ] Render confidence score as small badge.
- [ ] Show one-line summary (description length ≤80 chars, invitee count).
- [ ] Ensure dark-mode compatible styling using theme palette.
- [ ] Write unit tests with React Testing Library & Jest.
- [ ] Update E2E tests for new editing flow.
- [ ] Update documentation and storybook (if any) for component.

## Notes

User preferences confirmed on 2025-06-11:

- Layout: keep existing input & results list; event previews inline below input.
- Editing: quick-edit inline for common fields.
- Fields: Title, Date/Time, Location, Confidence + one-line summary of rest.
- UI Library: Material-UI only.
- Event Ordering: list sequentially as parsed.
- Dark Mode: yes, must inherit theme.

### Best Practices Considered

- Leverage MUI `Card` / `Paper` with theme palette for automatic dark-mode support.
- Avoid heavy DataGrid; use lightweight card list.
- Use `TextField` `variant="standard"` or `filled` for compact edit fields.
- Use MUI `DateTimePicker` from `@mui/x-date-pickers` inside `LocalizationProvider`.
- Use `IconButton` with `Edit`, `Save`, `Cancel` for quick-edit toggling.
- Keep local state in each card; bubble changes up via callback.
- Apply accessibility attributes (aria-labels) on interactive controls.
- Responsive layout with `Stack` / `Grid`.

### Implementation Strategy

1. Component hierarchy: `EventPreviewList` → `EventPreviewCard`.
2. Parent (`TextInputForm`) owns `events`; child cards emit `onUpdate`.
3. Theme-aware styling and dark-mode compliance via palette.
4. Tests: unit (React Testing Library) & E2E updates.
5. Incremental integration: build components in isolation then replace placeholder list.

### Detailed Implementation Checklist

- [ ] Create `components/calendar/EventPreviewCard.tsx` (view & edit modes).
- [ ] Create `components/calendar/EventPreviewList.tsx` that maps events.
- [ ] Update `components/calendar/TextInputForm.tsx` to use list component.
- [ ] Add `onUpdateEvent` handler in `TextInputForm`.
- [ ] Implement quick-edit fields for Title, Date/Time, Location.
- [ ] Confidence badge (Typography caption).
- [ ] One-line summary (description + invitee count, ≤80 chars).
- [ ] Dark-mode styling.
- [ ] Unit tests for render/edit/save/cancel.
- [ ] E2E test coverage for editing flow.
- [ ] Docs/storybook update.
- [ ] Peer review, lint, type-check.
- [ ] User approval to mark story complete.

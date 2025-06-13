# Story: Add Batch Calendar Actions

**Status**: Planning

---

## Related Requirement

<!-- Link to relevant requirement once identified -->

[LINK to requirement]

## Alignment with Design

<!-- Link to relevant design section once created -->

[LINK to design section]

## Acceptance Criteria

- Users can select individual events with checkboxes; a "Select All" control is present and active by default.
- A top toolbar displays batch action buttons for:
  1. Add to Google Calendar (opens provider URL with all selected events).
  2. Add to Outlook Calendar (opens provider URL with all selected events).
  3. Download consolidated ICS file containing every selected event.
- Batch actions respect the current selection (all vs. subset).
- When exporting to ICS, multiple events are combined into a single `.ics` file (one VEVENT per event).
- Provider URL approaches (Google, Outlook) are used; no direct Calendar API integrations required.
- Feature functions on desktop and mobile, with keyboard-accessible controls.
- Error handling surfaces a clear toast/snackbar per failed event but continues processing others.
- Story tasks are covered by unit and E2E tests.
- User must sign off on functionality before story can be marked complete.

## Tasks

- [ ] Perform web research on best practices for multi-event calendar exports (Google, Outlook, ICS spec).
- [ ] Analyse codebase to locate event state store and UI locations for toolbar injection.
- [ ] Design batch-selection checkbox mechanism with "Select All" default.
- [ ] Implement selection state management (Context or Redux store).
- [ ] Create utility to generate Google & Outlook URLs for multiple events.
- [ ] Create utility to build consolidated `.ics` file (one VEVENT per event).
- [ ] Build batch actions toolbar component and integrate into Calendar Parser page.
- [ ] Wire up toolbar actions to utilities.
- [ ] Add unit tests for utilities and selection logic.
- [ ] Add E2E tests for batch actions flow.
- [ ] Update documentation/examples as needed.
- [ ] Obtain user approval.

## Notes

User preferences captured (2025-06-12):

- Selection: Checkbox per event, "Select All" checked by default.
- Export formats: Google Calendar URL, Outlook URL, consolidated ICS download.
- Integration method: Provider URLs & direct downloads; no API integrations now.
- Output: Multiple events in single output (.ics) if feasible; otherwise individual provider additions per event.
- Toolbar position: Top toolbar.
- No additional accessibility/UX requirements beyond standard best practices.

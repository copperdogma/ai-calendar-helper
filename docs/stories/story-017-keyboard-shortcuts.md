# Story: Implement Keyboard Shortcuts

**Status**: Done

---

## Acceptance Criteria

- Users can invoke key actions with shortcut keys:
  - ⌘/Ctrl + Enter: Parse Events (submit text input)
  - Esc: Clear text input or close dialogs
  - ⌘/Ctrl + S: Save edits in event card edit mode
- Shortcuts work in both desktop and accessible focus contexts.
- E2E tests assert shortcut functionality.
- No accessibility conflicts (ARIA).

## Implementation Summary

Shortcuts were implemented directly in component handlers (`TextInputForm` and `EventPreviewCard`) using `onKeyDown` events. E2E tests in `auth-calendar-workflow.spec.ts` verify ⌘/Ctrl + Enter triggers parsing.

All validation, linting, and tests pass.

---

## Sign-Off

User confirmed shortcuts working across supported browsers. Story 017 is **Done**.

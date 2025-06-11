# Story: Implement Calendar Parser Page & Default Routing

**Status**: To Do

---

## Related Requirement

<!-- TODO: Link to requirement when added -->

[Pending requirement link]

## Alignment with Design

Refer to [Design.md – Application Pages Structure](../design.md#application-pages-structure)

## Acceptance Criteria

- Upon successful login, the user is automatically redirected to the "Calendar Parser" page (`/calendar-parser`).
- Visiting the root path (`/`) while authenticated also redirects to `/calendar-parser`.
- The existing `Dashboard` page is removed and its functionality (TextInputForm + EventPreviewList) relocated to the new Calendar Parser page.
- Navigation items reflect the new page (e.g., "Calendar Parser", "Profile", "About").
- Unauthenticated users are still routed to the login page first and, after login, continue to `/calendar-parser`.
- Unit tests cover routing changes and page render (≥90% coverage for modified files).
- E2E tests updated to use `/calendar-parser` as the primary flow entry.
- Application passes lint, type-check, and existing test suites after changes.
- [ ] User must sign off on functionality before story can be marked complete.

## Tasks

- [ ] Remove or rename existing `Dashboard` route components.
- [ ] Create new page at `app/calendar-parser/page.tsx` exporting existing text-to-calendar UI.
- [ ] Update `middleware.ts` and/or NextAuth callback to redirect post-login to `/calendar-parser`.
- [ ] Add redirect from `/` to `/calendar-parser` for authenticated users (and unauthenticated if desired).
- [ ] Update navigation menu/components to reference Calendar Parser page.
- [ ] Adjust tests: unit (routing), E2E flows starting at `/calendar-parser`.
- [ ] Update documentation and README routes overview.
- [ ] Peer review, lint, type-check.

## Notes

The Calendar Parser page becomes the primary landing page, simplifying user flow. Profile and About remain unchanged. Future "Calendar Summarizer" page will be added separately.

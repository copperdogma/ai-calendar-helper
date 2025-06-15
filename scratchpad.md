# Documentation Optimization Project (Review COMPLETE)

This scratchpad tracks the comprehensive audit and strategic split of project documentation into **Cursor Rules** (for AI) and **Reference Documentation** (for humans), following the guidelines in `@cimprove-project-documents.mdc`.

### Phase 1: Discovery & Strategic Categorization (COMPLETE)

- [x] Scanned all technical documentation.
- [x] Categorized docs for migration to Cursor Rules or retention as Reference Docs.
- [x] Mapped glob patterns for all auto-attached rules.

### Phase 2: Cursor Rules Review & Content Extraction (COMPLETE)

- [x] Merged `docs/TESTING.md` and `docs/testing/*` into `testing.mdc`.
- [x] Confirmed `authentication.mdc` was sufficient and removed `docs/AUTHENTICATION.md`.
- [x] Confirmed `debugging.mdc` was sufficient and removed `docs/logging.md`.
- [x] Merged `docs/formatting.md`, `docs/solid-principles.md`, and `docs/typescript-eslint-rules.md` into `formatting-linting.mdc`.
- [x] Merged `docs/deployment/*` into `deployment.mdc`.

### Phase 3: Reference Documentation Optimization (COMPLETE)

- [x] Streamlined `README.md` to point to new rules.
- [x] Streamlined `SETUP.md` to point to new rules.

### Phase 4: Implementation & Integration Strategy (COMPLETE)

- [x] Ensured `.cursor/` is NOT in `.gitignore` so rules are version-controlled.
- [x] Deleted `.cursorindexingignore` to ensure rules are indexed for context.

### Phase 5: Validation & Quality Assurance (COMPLETE)

- [x] Verified that auto-attached rules (`testing.mdc`) activate correctly based on their globs.

---

### Legacy Issues (from previous scratchpad)

- do the evals include a bunch of examples with one, two, and three events?
- When editing the date/time text (not using the calendar picker), hitting return re-parses the events. It should be the equivalent of clicking the "OK" button in the editing panel. When editing the event title, hiting return properly saves the changes and doesn't re-parse the events.
- footer has "Your Website Name 2025"
  - \*\* external todo: update the template repo to replace this with the actual website name

# AI Calendar Helper - Work Phase Scratchpad

## Documentation Optimization Project

**CRITICAL PROJECT**: Implementing strategic split between Cursor Rules (auto-injected AI context) and Reference Documentation (comprehensive guides)

### Phase 1: Discovery & Strategic Categorization ✅ COMPLETE

#### Documentation Inventory:

**Root Level:**

- [x] README.md (10KB) - Keep as main project intro
- [x] SETUP.md (6.1KB) - Analyze for cursor rule extraction
- [x] Configuration files: eslint.config.mjs, prettier configs, jest.config.js, playwright.config.ts

**Docs Directory:**

- [x] **FOR CURSOR RULES CONVERSION:**

  - AUTHENTICATION.md (4.1KB) → authentication.mdc
  - TESTING.md (7.6KB) → testing.mdc (ALREADY EXISTS - needs review/update)
  - formatting.md (2.7KB) → formatting-linting.mdc
  - logging.md (5.3KB) → debugging.mdc
  - solid-principles.md (4.7KB) → integrate into coding standards rule
  - typescript-eslint-rules.md (2.7KB) → integrate into formatting-linting.mdc
  - deployment/ directory → deployment.mdc (ALREADY EXISTS - needs review)
  - pwa-testing.md (3.2KB) → integrate into testing.mdc
  - ai-agent-guide.md (4.3KB) → agent-workflow.mdc

- [x] **KEEP AS REFERENCE DOCS:**
  - requirements.md (4.1KB) - Strategic decisions
  - design.md (22KB) - System design & architecture
  - architecture.md (8.2KB) - Technical architecture
  - stories.md + stories/ - Project management
  - build-log/ - Historical tracking
  - examples/ - Code examples
  - templates/ - Template files
  - NextAuth adapter docs (3 files) - Comprehensive guides

#### Existing Cursor Rules Audit:

- [x] testing.mdc (5.6KB) - EXISTS, needs review against TESTING.md
- [x] deployment.mdc (6.6KB) - EXISTS, needs review against deployment/
- [x] Many c-prefix rules (workflow commands)
- [x] Need to create: authentication.mdc, api-development.mdc, ui-components.mdc, database.mdc, formatting-linting.mdc, debugging.mdc

### Phase 2: Cursor Rules Creation & Content Extraction ✅ COMPLETE

#### Auto-Attached Rules Created:

- [x] authentication.mdc - ✅ WITH GLOBS: `["**/auth/**", "**/login/**", "lib/auth*", "middleware.ts", "app/api/auth/**"]`
- [x] api-development.mdc - ✅ WITH GLOBS: `["app/api/**", "**/*route.ts", "lib/api*"]`
- [x] ui-components.mdc - ✅ WITH GLOBS: `["components/**", "**/*.tsx", "app/**/page.tsx", "app/**/layout.tsx"]`
- [x] database.mdc - ✅ WITH GLOBS: `["prisma/**", "lib/prisma*", "**/*migration*", "**/*seed*"]`
- [x] formatting-linting.mdc - ✅ WITH GLOBS: `["eslint.config.*", "prettier.config.*", "**/.prettierrc*"]`

#### Agent-Requested Rules Created:

- [x] debugging.mdc - ✅ WITH DESCRIPTION: "Debugging procedures, logging conventions, and troubleshooting steps"

#### Rules Still To Create/Review:

- [x] agent-workflow.mdc - ✅ WITH DESCRIPTION: "AI agent workflow guidelines and development procedures"

### Phase 3: Reference Documentation Optimization 🔄 IN PROGRESS

#### Rules Review Tasks:

- [x] Review testing.mdc against TESTING.md - ✅ COMPREHENSIVE (450 lines, includes all npm scripts, Jest multi-project config, Playwright E2E testing, coverage standards, debugging procedures)
- [x] Review deployment.mdc against deployment/ directory - ✅ COMPREHENSIVE (320 lines, includes PM2 config, Fly.io deployment, environment management, complete flyio.md content)
- [x] Update project-reference.mdc after other rules are created - ✅ COMPLETE (Added comprehensive Cursor Rules Ecosystem section with all auto-attached and agent-requested rules)

#### Documentation Streamlining:

- [ ] Remove procedural content from reference docs now covered by cursor rules
- [ ] Add cross-references to related cursor rules in docs
- [ ] Focus docs on "why" explanations and architectural context
- [ ] Ensure examples and tutorials maintain educational value

### Phase 3: Reference Documentation Optimization

- [ ] Streamline comprehensive guides by removing procedural content now in cursor rules
- [ ] Add cross-references to related cursor rules
- [ ] Focus docs on "why" explanations and architectural context
- [ ] Maintain examples and tutorials with educational value

### Phase 4: Implementation & Integration Strategy

- [ ] Test glob patterns match intended files
- [ ] Verify rules activate in expected contexts
- [ ] Update reference docs with cursor rule cross-references
- [ ] Ensure consistent formatting across cursor rules

### Phase 5: Validation & Quality Assurance

- [ ] Test cursor rules effectiveness in real scenarios
- [ ] Validate reference documentation completeness
- [ ] Final integration and cleanup
- [ ] Create organization summary

### Decisions Made:

- Keep project management docs (stories.md, build-log/) as reference
- Transform all procedural technical docs to cursor rules
- Maintain architectural/design docs as comprehensive reference
- Use auto-attached rules for file-specific guidance
- Use agent-requested rules for cross-cutting concerns

## OUTSTANDING ISSUES

- do the evals include a bunch of examples with one, two, and three events?
- When editing the date/time text (not using the calendar picker), hitting return re-parses the events. It should be the equivalent of clicking the "OK" button in the editing panel. When editing the event title, hiting return properly saves the changes and doesn't re-parse the events.
- footer has "Your Website Name 2025"
  - \*\* external todo: update the template repo to replace this with the actual website name

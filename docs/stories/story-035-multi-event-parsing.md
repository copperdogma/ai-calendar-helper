# Story: Enhance AI Parsing for Multiple Events

**Status**: Done ✅ (Code review complete, all tests passing, production ready)

---

## Related Requirement

- Text-to-Calendar feature must support parsing user input that contains more than one event at a time. (Requirements section TBD)

## Alignment with Design

- Aligns with TextInputForm UX that expects an array of events.
- Enables upcoming Batch Calendar Actions toolbar (Story 010) by ensuring multiple events are available in one parse action.

## Acceptance Criteria

- AI `/api/ai/parse-events` endpoint recognizes and extracts **all** events found in a single text block.
- AI `/api/ai/parse-events` endpoint uses a two-phase OpenAI strategy: (1) segmentation pass returns ≤10 text chunks, (2) per-chunk parsing returns structured events. Endpoint ultimately returns `events` array with ≥1 items.
- Response JSON structure: `{ success: true, events: ParsedEvent[] }` where `events.length ≥ 1`.
- Front-end `parseEventsWithAi` adapts to handle array response and surfaces all events.
- Front-end unchanged (already array). Endpoint latency remains reasonable (< 8 s for 10 events).
- Unit tests cover scenarios with 0, 1, and multiple events.
- E2E test: Enter text with at least 3 events; verify UI shows 3 event cards.
- Must maintain backward compatibility for clients expecting single-event response (feature flag or new version path).
- User signs off before story closed.

## Tasks

- [x] Research & design segmentation strategy (char-offsets → line-numbers) and prompts.
- [x] Implement `segmentText` & `parseEventChunk` helpers in `AIProcessingService`.
- [x] Update `/api/ai/parse-events` route and TypeScript types (`SegmentChunk`, etc.).
- [x] Adapt `parseEventsWithAi` and UI plumbing (`TextInputForm`, `EventPreviewList`).
- [x] Unit tests for segmentation, chunk parsing, and happy/error paths (all Jest suites green).
- [x] E2E test for multi-event parse flow (Playwright scenario with 3 events).
- [x] Update API docs & README examples.
- [x] **CODE REVIEW COMPLETE**: Comprehensive review conducted following SOLID principles, security audit, performance analysis, and architectural assessment. All recommendations implemented.

## Notes

- This story is a **dependency** for Story 010 (Batch Calendar Actions). Work on Story 010 can proceed in parallel on UI portions but cannot be completed until multi-event parsing is functional.

### Phase 1: Design & Research

- [x] Decide on two-phase approach (segment then parse).

### Phase 2: Implementation ✅

- [x] Add `segmentText` helper to `AIProcessingService` (prompt: return `chunks` array).
- [x] Add `parseEventChunk` helper for field extraction.
- [x] Update `extractEvents` to orchestrate both calls with cap 10.
- [x] Update API route to use new `extractEvents`.
- [x] Refactor types if needed (add `SegmentChunk` type).

### Phase 3: Testing ✅

- [x] Unit tests for helpers & integration (OpenAI mocked).
- [x] API route behaviour covered indirectly via service tests.
- [x] E2E test for multi-event parsing (working end-to-end).

### Phase 4: Documentation ✅

- [x] Update README and examples.
- [x] User approval.

### Phase 5: Code Review & Optimization ✅

- [x] **SOLID Principles**: Clean separation of concerns, single responsibility maintained
- [x] **DRY Principles**: No code duplication, reusable validation and transformation utilities
- [x] **Security Audit**: Input validation with Zod schemas, proper error sanitization
- [x] **Performance Analysis**: Efficient parallel processing, proper resource cleanup
- [x] **Error Handling**: Robust error handling with proper categorization and user-friendly messages
- [x] **Type Safety**: Proper TypeScript interfaces and runtime validation
- [x] **Database Fix**: Resolved Jest environment pollution affecting database connections
- [x] **Production Ready**: All tests passing, linting clean, comprehensive logging implemented

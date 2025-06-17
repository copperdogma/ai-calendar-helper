### Legacy Issues (from previous scratchpad)

- nice to have: we have three prompts, so give UI feedback when processing. Currently when you click "Parse Events" it says "Parsing", but let's add more detail. Maybe near the button or replacing the button text (you decide) it says "Reading input..." "Found X events" "Parsing event 1" "Parsing event 2" "Parsing event 3" etc
- docs again: refine instructions to break docs down into two sections each: setup and usage. Currenly they're mixed and confusing. But also think about maybe putting all setup steps just in SETUP.md. We only need them if someone pulls the repo from scratch and wants to set it up, or for future refeence if we need to know how it was set up int he first place. I think it's just polluting context by including any setup steps in the usage instructions.
- When editing the date/time text (not using the calendar picker), hitting return re-parses the events. It should be the equivalent of clicking the "OK" button in the editing panel. When editing the event title, hiting return properly saves the changes and doesn't re-parse the events.
- footer has "Your Website Name 2025"
  - \*\* external todo: update the template repo to replace this with the actual website name

---

## Current Story

Refactor calendar text segmentation to use a multi-stage prompt chain for higher accuracy.

## Current Task

Implement a three-prompt pipeline in `AIProcessingService`:

1. Identification Prompt – counts & summarizes events.
2. Start-Line Prompt – only if multiple events: choose first-line numbers for each event.
3. Existing extraction prompt (per event) – unchanged.

## Plan Checklist

- [ ] Create new prompt constant `identificationPrompt.ts`.
- [ ] Create new prompt constant `startLinesPrompt.ts`.
- [ ] Update `AIProcessingService`:
  - [ ] Add `buildIdentificationPrompt` and `buildStartLinesPrompt`.
  - [ ] Replace current `segmentText` flow:
    1. Call Identification prompt on raw text (no line numbers).
    2. Parse JSON → `events` array.
    3. If `events.length === 1`, return a single chunk spanning all lines (existing behaviour).
    4. Else, call Start-Line prompt with:
       • `events` array (summaries)
       • enumerated input (with line numbers)
       → expect `{ "starts": [ ... ] }` (same schema as before).
    5. Build `SegmentChunk[]` from returned starts (reuse existing code).
- [ ] Unit-adapt existing tests/evals later (not now).
- [x] Create new eval prompt `prompts/event-split-chain.js` that implements identification + start-lines calls.
- [x] Update `evals/promptfoo-split.yaml` to use the new chain prompt.
- [ ] Fix chain script to work with promptfoo (llm.invoke), then run `promptfoo eval`.
- [ ] Ensure `processWithRetry` already enforces JSON (`response_format: { type: 'json_object' }`) – confirmed.
- [ ] Keep single-event fast path (no extra OpenAI call).

## Issues/Blockers

- Must guarantee backward compatibility for other callers expecting `segmentText`.
- Evaluation harness will still hit segmentation prompt directly; adapt later.

## Recently Completed

- Prompt tuning attempts (abandoned in favor of new pipeline).

---

- [x] Create new eval prompt `prompts/identification.js` (string prompt).
- [x] Create new fixture and scorer for identification eval.
- [x] Add YAML `promptfoo-identify.yaml`.

## Decisions Made

- Switched eval providers from `gpt-4o-mini` to `gpt-4.1-nano` as per user request.

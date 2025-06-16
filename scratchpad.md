# Documentation Optimization Project (Review COMPLETE)

## Current Story

Story 010 – Add batch calendar actions (Planning)

## Current Task

Tweak event splitter evals so that context lines (e.g. Addy/Jordan birthday) are included in the second event chunk. Update dataset expected indices and improve splitter prompt rules.

## Plan Checklist

- [ ] Identify anonymised test cases in `evals/fixtures/split-lines-dataset.jsonl` that need boundary adjustments (at minimum first row).
- [ ] Decide correct start line numbers that preserve necessary context.
- [ ] Update the `expected` arrays in the dataset accordingly.
- [ ] Refine `evals/prompts/event-split-lines.js` rules to prefer earliest narrative lines that introduce the event (e.g. "X's birthday is next ...") so the LLM outputs the updated indices.
- [ ] Re-run `promptfoo` split evals locally to verify all tests pass.
- [ ] Iterate on prompt until all evals green.

## Issues/Blockers

None yet.

## Recently Completed

- Initial bug triage for birthday email input cutoff (not yet fixed).

## Decisions Made

- Treat narrative lines mentioning "birthday" with a date/time reference as valid event start lines.

## Lessons Learned

- Context lines before a formal event header are critical for downstream event parsing accuracy.

### Legacy Issues (from previous scratchpad)

- bug: Addys birthday email input, by itself, gets the top lines cut off which means the title doesn't include that it's HER birthday
- When editing the date/time text (not using the calendar picker), hitting return re-parses the events. It should be the equivalent of clicking the "OK" button in the editing panel. When editing the event title, hiting return properly saves the changes and doesn't re-parse the events.
- footer has "Your Website Name 2025"
  - \*\* external todo: update the template repo to replace this with the actual website name

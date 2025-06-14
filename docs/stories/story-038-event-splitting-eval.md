# Story 038: Event Splitting Evaluation Harness

## Metadata

- **Story ID**: 038
- **Title**: Event Splitting Evaluation Harness
- **Author**: AI Assistant
- **Status**: Planning
- **Priority**: Medium
- **Created**: 2025-06-14
- **Tags**: prompt-eval, testing, ai
- **Epic Link**: Prompt Refinement

## Background & Context

The existing prompt evaluation harness (Story 036) focuses on overall event extraction accuracy. However, empirical testing has revealed a recurring issue: the model occasionally **over-splits** or **under-splits** events when parsing complex or multi-event inputs. This story introduces a dedicated evaluation suite that specifically targets the _event-splitting logic_ so that future prompt tweaks can be measured against a stable baseline.

Examples of the current failure modes:

1. Input with two clearly distinct events → model returns **three** events.
2. Long email describing a single event in multiple ways → model returns **two** separate events.

A purpose-built dataset will help us iterate on prompt instructions and quickly detect regressions.

The goal has narrowed: **evaluate ONLY the model's ability to correctly identify event boundaries/count** in a block of natural-language text. Unlike the full JSON extractor (Story 036), this harness ignores titles, dates, locations, etc. We care solely about _how many_ distinct events are present (or, optionally, the line numbers at which each new event begins).

## Objectives

1. Produce a deterministic prompt (`event-split-count.js`) that, given input text, returns **either**:
   • a single integer (event count) _or_
   • a JSON array of the starting line indexes of each event (TBD).
   We will start with the simpler integer-count response.
2. Build a lightweight scorer (`event-count-accuracy.js`) that passes when the returned integer equals the expected value.
3. Curate a dataset of at least 18 examples (rambling single-event emails and multi-event schedules up to six events).
4. Integrate with Promptfoo via `promptfoo-split.yaml`.
5. Achieve ≥ 95 % pass-rate on the dataset.

## Deliverables

- `evals/fixtures/split-lines-dataset.jsonl` with ≥ 6 anonymised test cases.
- `evals/promptfoo-split.yaml` referencing the new fixture and the standard scorer.
- Documentation in `/docs/requirements.md` → Testing section (note optional).

## Acceptance Criteria

- [ ] Story record marked **Done** once the harness reaches ≥ 95 % pass-rate.
- [ ] `evals/prompts/event-split-count.js` exists and is documented.
- [ ] `evals/scorers/event-count-accuracy.js` correctly computes accuracy.
- [ ] `evals/fixtures/split-lines-dataset.jsonl` contains ground-truth counts.
- [ ] `evals/promptfoo-split.yaml` points to the new prompt, scorer, and dataset.
- [ ] CI task (`npm run test:prompt-evals`) green.

## Task Checklist

- [ ] Draft prompt (return integer) ✔︎
- [ ] Implement scorer ✔︎
- [ ] Transform existing fixtures → count dataset ✔︎
- [ ] Update Promptfoo config ✔︎
- [ ] Run evaluation & iterate until ≥ 95 % pass.

## Tasks

1. Research existing open-source prompt evaluation datasets that focus on segmentation/splitting (e.g., Event-Extraction corpora, `promptfoo` examples).
2. Draft 10 candidate inputs; pick the best 6 that cover edge-cases:
   - Mixed short + long events in one blob.
   - Single long email with one event.
   - Two events on same line separated by "and".
   - Multi-paragraph newsletter with three events.
   - Ambiguous RSVP phrasing that should _not_ create an extra event.
3. Anonymise personal data (names, addresses) while keeping realism.
4. Encode expected JSON for each.
5. Commit fixture + YAML.
6. Smoke-run `npx promptfoo eval evals/promptfoo-split.yaml`; iterate until 100 % pass.
7. PR review & merge.

## Related Work

- Story 036 – Prompt Refinement Harness (baseline infrastructure)

## Notes & Discussion

- **Time-dependency**: Use explicit dates rather than relative words where possible to avoid flakiness. Where "tomorrow" is required, assume baseline date `2025-06-14` to match existing fixtures.
- **Scorer**: The current `event-json-accuracy.js` already fails if the count mismatches, so no new scorer is required.

---

_End of file_

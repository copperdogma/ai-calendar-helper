# Story: Prompt Refinement Harness

**Status**: Done

---

## Objective

Develop an automated evaluation harness that sends a suite of curated natural-language inputs to the live OpenAI API and scores the model/prompt output against ideal JSON schemas. The harness will help select the best model and iteratively refine our prompt for higher extraction accuracy.

## Acceptance Criteria (Draft)

- At least 30–50 diverse sample inputs (single event, multi-event, edge cases).
- Each input has a corresponding "ideal" JSON output specification.
- Evaluation script hits real OpenAI endpoint (rate-limited, with env API key).
- Scoring function compares critical fields (date, time, location, title) for exact match; tolerates benign variations (description wording, whitespace).
- Aggregate report: overall accuracy %, per-field accuracy, per-example pass/fail.
- Supports multiple model+prompt versions via simple config.
- Evaluation results exportable to standard format (e.g., JSON Lines or `manifest` compatible with OpenAI Evals).
- CI job can run the harness (optionally behind a flag to avoid quota drain).

## Research & Planning Tasks (see scratchpad)

Refer to **Prompt Refinement Harness Research & Planning Checklist** in `scratchpad.md` for live progress tracking.

---

## Planning Summary (2025-06-14)

We will implement an automated prompt evaluation harness using **Promptfoo**. Key characteristics:

- **Framework**: Promptfoo (TypeScript-native, simple CLI)
- **Dataset**: JSONL fixtures (initial 30–50 examples) stored in `evals/fixtures/`
- **Scoring**: Custom JS scorer `event-json-accuracy.js` compares `title,startDate,endDate,location`
- **Config**: `evals/promptfoo.yaml` sets provider `openai:gpt-4o-mini`, $0.20 cost cap, HTML & console output
- **Run Command**: `npm run eval:prompt` (manual only, not in default CI)

All implementation tasks are tracked in `scratchpad.md` under _Prompt Refinement Harness_ checklist.

---

## Notes

- Investigate existing open-source eval frameworks: **OpenAI Evals**, **LangChain Benchmarks**, **Promptfoo**, etc.
- Consider storing test cases in a machine-readable format (`fixtures/*.json`).
- Need strategy for API cost control (e.g., cache responses or nightly cron run).

---

### Completion Notes (2025-06-14)

Prompt evaluation harness implemented with Promptfoo, dynamic date injection, expanded dataset (~70 cases), HTML and console reporting, cross-platform env loading via `dotenv-cli`, and git-ignored reports. See `README` or run `npm run eval:prompt` for usage.

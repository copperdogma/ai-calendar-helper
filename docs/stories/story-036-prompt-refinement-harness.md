# Story: Prompt Refinement Harness

**Status**: Planning

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

## Notes

- Investigate existing open-source eval frameworks: **OpenAI Evals**, **LangChain Benchmarks**, **Promptfoo**, etc.
- Consider storing test cases in a machine-readable format (`fixtures/*.json`).
- Need strategy for API cost control (e.g., cache responses or nightly cron run).

---

(Planning in progress.)

# Story: Vision Model Experimentation – Evaluate GPT-4.1-nano for Image Event Extraction

**Status**: 📝 PLANNING – research & planning phase initiated (see scratchpad.md)

---

## Related Requirement

[Requirement #3: AI Text Processing](../requirements.md#ai-text-processing) – Extend to vision input; optimise cost-accuracy trade-off.

## Overview

Story 041 introduced image-based event extraction using the default `gpt-4o-mini` vision model. Early feedback suggests **GPT-4.1-nano** may also support image inputs at a lower cost. This story aims to:

1. Verify that GPT-4.1-nano (vision) is available and functional for our use-case.
2. Run the existing _image extraction_ eval harness across both models, comparing accuracy, latency, and cost.
3. Optimise prompts for GPT-4.1-nano if accuracy initially lags.
4. Provide a configurable fallback mechanism to switch vision models via environment variable (`OPENAI_IMAGE_MODEL`).
5. Document findings and update production defaults where appropriate.

## Acceptance Criteria

- [ ] GPT-4.1-nano vision capability confirmed via successful test query.
- [ ] Eval harness (`evals/extract-events-from-image.yaml`) executed against both models, producing comparative metrics.
- [ ] GPT-4.1-nano achieves ≥95 % of GPT-4o-mini's accuracy while reducing cost by ≥40 %.
- [ ] Prompt optimisations (if any) are documented and integrated into `lib/prompts/extractEventPrompt.ts`.
- [ ] Environment variable `OPENAI_IMAGE_MODEL` supports `gpt-4o-mini` (default) and `gpt-4.1-nano`.
- [ ] Unit tests and E2E tests pass with either model selected.
- [ ] Eval dataset includes BOTH input variants: (a) **image-only** event, and (b) **image + text** describing the same single event.
- [ ] Parsing logic correctly handles both variants under the assumption of **one event per input**.
- [ ] Story results documented in README / architecture docs with cost & accuracy charts.

## Task Checklist (initial draft)

- [ ] Confirm GPT-4.1-nano vision endpoint availability and pricing.
- [ ] Update OpenAI client config to allow model override for image requests.
- [ ] Update eval harness to accept model as parameter **and** iterate over two input variants (image-only, image + text).
- [ ] Expand fixtures in `evals/fixtures/images/` and `evals/fixtures/image-text/` to cover both variants (single-event assumption).
- [ ] Run evals for `gpt-4o-mini` (baseline) and `gpt-4.1-nano`; collect results.
- [ ] Analyse metrics: accuracy, cost per request, latency.
- [ ] If accuracy < threshold, iterate prompt (few-shot, schema enforcement) and rerun evals.
- [ ] Update prompts and codebase with successful optimised prompt.
- [ ] Add `.env.example` note for `OPENAI_IMAGE_MODEL`.
- [ ] Update docs and Storybook where relevant.
- [ ] Prepare PR with findings; request user sign-off.

## Notes & Considerations

- GPT-4.1-nano costs are estimated at $0.40/$1.60 per 1M tokens (vision pricing TBD). Need confirmation.
- Ensure image size limits (≤5 MB) and MIME checks remain unchanged.
- Maintain strict JSON output schema for uniform event objects.
- Keep eval dataset in `evals/fixtures/images/` for reproducibility.

## Dependencies

- Story 041 must be merged (core image extraction flow complete).
- Eval harness (`extract-events-from-image.yaml`) needs to be finalised.

## Risks & Mitigations

| Risk                                              | Mitigation                                                           |
| ------------------------------------------------- | -------------------------------------------------------------------- |
| GPT-4.1-nano vision unavailable or in closed beta | Fall back to GPT-4o-mini; story auto-closes                          |
| Accuracy significantly lower than baseline        | Prompt engineering iterations; maintain option to keep current model |
| Unexpected pricing higher than forecast           | Abort switch; document reason                                        |

---

_This file is generated as part of the research & planning phase (see rule `cnew-task-research-and-plan-doc-web`). Further detailed implementation checklist will be refined in scratchpad.md and synced back here before implementation begins._

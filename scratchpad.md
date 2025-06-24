### Current Story

## Future ToDo Items

- Apparently gpt-4.1-nano can ALSO do image processing. We should try that.
- Run evals for image processing, optimize prompt, try gpt-4.1-nano as the model
- If the user changes the timezone in the UI, change the timezone in the calendar export buttons

## Vision Model Experimentation Research & Planning Checklist

- [ ] Initial research questions identified (include data variants: image-only vs image+text)
- [ ] Web research completed
- [ ] Codebase analysis completed
- [ ] Best practices identified
- [ ] Implementation strategy developed
- [ ] Detailed implementation checklist created
- [ ] User preference questions identified and asked
- [ ] Plan reviewed and approved by user

## Image Dataset Description Update Research & Planning Checklist

- [x] Initial research questions identified
- [x] Codebase analysis completed (understand description field usage)
- [ ] Define lenient evaluation metric for description similarity (semantic embeddings, cosine ≥0.75; fallback Jaccard ≥0.4)
- [x] Script/approach for re-parsing images defined
- [x] Implementation strategy developed
- [x] Detailed implementation checklist created
- [x] User preference questions identified and asked
- [ ] Plan reviewed and approved by user

### Initial Research Questions (Image Description Update)

1. What similarity metric (Jaccard token overlap, cosine embedding similarity, etc.) does the user prefer for lenient description matching? What threshold?
2. Should we rely solely on OpenAI embeddings for semantic similarity, or prefer a free local model (e.g., `sentence-transformers`)?
3. Do we need a manual override file for descriptions the AI mis-parses, or is automatic extraction acceptable with post-hoc human review?
4. Should the update script run synchronously in CI, or will it be executed manually when dataset changes?
5. Any constraints on external API usage during the script (cost, environment variables)?

### Decisions Made (Image Description Update)

1. Similarity Metric: **Cosine similarity** on sentence embeddings using local `sentence-transformers` model (`all-MiniLM-L6-v2`). Pass threshold: **0.75**. Backup: token Jaccard ≥0.4.
2. Embedding Source: Local model to avoid API costs; no OpenAI embeddings required.
3. Manual Override: Provide optional `manualDescriptions.json` for human overrides if AI extraction is obviously wrong.
4. CI Integration: Script is manual-only; will not run in CI (per user directive).

### Implementation Strategy (Image Description Update)

1. **Script (`scripts/update-image-descriptions.ts`)**
   - Read `evals/fixtures/image-events-dataset.jsonl` line-by-line.
   - For each entry:
     - If `expected?.description` is missing or empty:
       - Load image (Buffer).
       - Call `parseEventImage(buffer)` from `AIProcessingService` with default model.
       - Update entry's `expected` with `description` (and optionally title etc.).
   - If `manualDescriptions.json` exists for an image filename, override description.
   - After processing, write back to file (newline-delimited JSON, sorted same order).
   - Pass CLI flags `--dry-run` and `--overwrite`.
2. **Similarity Scorer (`evals/scorers/description-similarity.js`)**
   - Load embeddings using `@xenova/transformers` (`all-MiniLM-L6-v2`).
   - Compute cosine similarity between predicted and expected description (lower-cased, trimmed).
   - Pass if ≥0.75; else compute Jaccard token overlap and pass if ≥0.4.
   - Return 1/0 for each sample; aggregate accuracy.
3. **Unit Tests**
   - `tests/unit/evals/image-dataset-description.test.ts`: ensure every dataset line has non-empty `expected.description`.
4. **Documentation**
   - Update README section for manual dataset regeneration and new scorer.
5. **Manual Run Notes**
   - Script should be executed manually (`npm run update:image-descriptions`). Not part of CI.

### Implementation Checklist

- [ ] Create `scripts/update-image-descriptions.ts` with CLI flags & processing logic.
- [ ] Add dependency `@xenova/transformers` for embeddings (or fallback `string-similarity`).
- [ ] Add `manualDescriptions.json` template in `evals/fixtures/`.
- [ ] Generate npm script in `package.json`.
- [ ] Implement new scorer `evals/scorers/description-similarity.js`.
- [ ] Update `evals/extract-events-from-image.yaml` to reference new scorer.
- [ ] Write Jest test for dataset completeness.
- [ ] Update README/docs.
- [ ] User review & sign-off.

### Image Description Work Queue

- [x] 67031-OC0CTQ-498.jpg – Save-the-date announcement for the wedding of Jane Mary and John Doe.
- [x] 346454-PAY33N-921.jpg – Save-the-date invitation for Mary & John's wedding at South West Hall, Miami, Florida.
- [x] 10800051.jpg – Save-the-date card for a wedding on 19 January 2024 at 1482 Hickory Lane, Washington DC.
- [x] 11495002.jpg – Invitation to celebrate Amelia and Morgan's wedding on 15 May 2025 at 1 PM, Lounge Club.
- [x] Aria's-10th-Birthday-Invitation---small.jpg – Birthday painting party invitation for Aria's 10th birthday.
- [x] ballerina-bow-49600.jpg – Invitation to celebrate Avery turning 25 on Saturday 17 October, 11 AM–3 PM at the Kidders', 91 Plains Avenue, Wyandotte.
- [x] beary-cute-pilot-49615.jpg – Join us to celebrate Tommy turning five on Saturday 16 May, 11 AM–2 PM at 291 Mulberry Drive, Lake Geneva, Wisconsin.
- [x] blooming-garden-49577.jpg – Birthday celebration for Daniela – let's celebrate on Friday 14 April, 7:30 PM to midnight at 539 Brookside Court, Holloway.
- [x] brew-power-49810.jpg – Tennis-themed "Game, Set, Match" invitation for Aria's 8th birthday party at Saddlebrook Sports Center, New Hope, PA.
- [x] cosmic-star-44431.jpg – Save-the-date card for Giselle's 40th birthday celebration on 12 September 2025, 7:30 PM–midnight at 539 Brookside Court, Holloway.
- [x] golden-stars-and-dots-37805.jpg – Invitation to celebrate Carol Porterfield's 24th birthday on 1 February 2025 at 3 PM, Oak Tree Tavern, Raleigh.
- [x] mining-cake-44610.jpg – Pixel-style cake invitation for Jacob's 5th birthday on 22 October at 5 PM, 70 West Oak Drive, Lakewood, IL.
- [x] once-upon-a-birthday-48485.jpg – Magical unicorn-themed party for Kaylee's 2nd birthday on 10 August, 11 AM–2 PM at The Lee Home, 1234 Park Road, San Diego.
- [x] stock-vector-concert-ticket-with-elegant-typography-featuring-event-details-like-date-time-seat-and-venue-2578481103.jpg – Concert ticket for Grand Concert Hall on 6 August at 8 PM, Row 10 Seat 7.

### Recently Completed

- Added curated descriptions for all 14 image fixtures & updated dataset 🔄
- Deleted obsolete `scripts/update-image-descriptions.ts` and removed npm script

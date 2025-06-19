# Story: Implement Image-based Event Extraction

**Status**: In Review – core functionality implemented; see checklist below.

---

## Related Requirement

[Pending requirement link]

## Overview

Allow users to upload an image (e.g., a flyer or screenshot) containing a single event and automatically extract the event details (title, date, time, location, description) using an AI vision model.

## Alignment with Design

TBD – will reference future design documentation for the upload component and extraction flow.

## Acceptance Criteria

- Users can upload an image in common formats (PNG, JPEG, HEIC, WebP) up to 5 MB.
- System processes the image via a high-end vision model (e.g., GPT-4o, Gemini Pro Vision) and extracts exactly one event.
- Extracted event appears in the existing event preview list with the same structure as text-parsed events.
- Confidence score is displayed; if below threshold, user receives an informative error with manual fallback.
- Errors (upload failures, model errors, unsupported formats) are handled gracefully and surfaced to the user.
- Feature covered by unit tests (extraction service) and E2E tests (upload flow) with ≥90 % coverage of new code.
- Meets existing lint, type, and test suites.

## Task Checklist (🔄 updated 2025-06-18)

### Core

- [x] Select default vision model (`gpt-4o-mini`) and document cost/override via `OPENAI_IMAGE_MODEL` env var.
- [x] Implement `parseEventImage` in `lib/ai.ts` (Buffer/base-64, prompt reuse, JSON output).
- [x] Support **combined context** – include optional free-form text (`additionalText`) with the image prompt.
- [x] Create backend route `POST /api/ai/parse-image-event` (multipart, MIME & 5 MB guard rails, validation, transforms).

### Front-end

- [x] Integrate upload into `TextInputForm` (drag-and-drop, attach button, progressive highlight overlay).
- [x] Parse button activates with text **or** image; error banners for invalid files.
- [x] Event preview pipeline accepts image-parsed events.

### Quality & Testing

- [x] Unit tests for `parseEventImage` (Buffer, base-64, error paths).
- [x] Unit tests for API route validation & transforms.
- [x] Playwright E2E test: authenticated image upload flow.
- [x] Lint/Type/Test suite passes; global coverage ≥84 %.

### Remaining / Nice-to-have

- [ ] Streaming SSE progress for image parsing (parity with text endpoint).
- [ ] Multi-image batch support with thumbnail strip UI.
- [ ] Improved error banners (replace current `alert`, i18n friendly).
- [ ] Rate-limit / auth gate toggle (`ENABLE_IMAGE_PARSING`).
- [ ] Cost telemetry surfaced in admin logs.
- [ ] Storybook docs & README updates.

## Notes

- Limit scope to a single event per image to reduce complexity.
- Ensure compliance with privacy/security (temporary storage, virus scanning if needed).
- Consider model token and image size costs; expose environment flag to disable in low-resource deployments.

## User Preferences (Confirmed 2025-06-18)

- Vision model: Use OpenAI vision models (evaluate GPT-4o Vision variants via new eval harness).
- Image size cap: 5 MB; accept only formats supported by OpenAI (PNG, JPEG/JPG, WEBP, non-animated GIF; HEIC if supported).
- UI placement: Image upload lives alongside existing text input; user may supply both inputs for a single combined event.
- Low-confidence handling: Parsed event is flagged (<0.7) but still editable by user rather than blocked.
- Storage policy: Process images entirely in memory; no persistent storage.

## Best Practices Considered (Revised)

- Encode uploads to base64 data-URIs to avoid temporary files/URLs.
- Resize client-side (≤1024 px) to improve latency and reduce token count.
- Provide explicit JSON schema in prompt to enforce structured output.
- Reuse existing `ExtractedEvent` type for uniform UI pipeline.
- Protect new API route with auth/rate-limiting to prevent abuse.

## Risks & Mitigations

| Risk                                    | Mitigation                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| Large images slow or exceed cost budget | Enforce 5 MB limit; warn >2 MB; optional client resize                         |
| Vision model misreads complex layouts   | Build eval harness with 20-30 sample flyers; iterate prompt; consider cropping |
| API cost spike                          | Gate feature behind `ENABLE_IMAGE_PARSING`; monitor usage                      |
| Security – malicious uploads            | Validate MIME/type; limit size; process in memory; discard buffer immediately  |

## Implementation Strategy

1. Choose OpenAI GPT-4o Vision model (initial) and abstract via `AIProcessingService` → `parseEventImage`.
2. Backend: `/api/ai/parse-image-event` – multipart/form-data (fields: `image`, optional `text`, `options`).
3. Frontend: Add `ImageUploadForm` next to `TextInputForm`; on submit, combine text & image flow.
4. Append extracted event(s) to global events state; flag for low confidence.
5. Testing: unit (mocked OpenAI), E2E (Playwright), and new eval harness.
6. Documentation updates and Storybook entry.

## Detailed Implementation Checklist

- [ ] Extend `lib/ai.ts` with `parseEventImage` using OpenAI vision model.
- [ ] Implement `app/api/ai/parse-image-event/route.ts` with multipart handling & validation.
- [ ] Add Zod schema `ImageParseRequestSchema`.
- [ ] Create `components/calendar/ImageUploadForm.tsx` with drag-and-drop UI.
- [ ] Integrate upload form into `calendar-parser` page layout.
- [ ] Update global events context/reducer to merge image + text parsing.
- [ ] Add low-confidence flag handling in `EventPreviewCard`.
- [ ] Write unit tests for AI service and API route.
- [ ] Add Playwright E2E test uploading a sample image.
- [ ] Create eval harness `evals/extract-events-from-image.yaml` and scorer.
- [ ] Update documentation (README, Story docs, Storybook).
- [ ] Ensure lint/type/test pipeline passes.
- [ ] User review & sign-off.

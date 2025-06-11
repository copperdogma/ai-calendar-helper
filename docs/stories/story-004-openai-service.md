# Story: Implement OpenAI text processing service

**Status**: To Do

---

## Related Requirement
[Text-to-Calendar Feature](../requirements.md#1-text-to-calendar-primary-feature) - Parse text to extract event details, support common date/time formats, provide confidence scoring

## Alignment with Design
[AI Processing Enhancement](../design.md#ai-processing-enhancement) - GPT-4 API for structured data extraction with prompt engineering

## Acceptance Criteria
- OpenAI API integration is properly configured
- Text processing service extracts structured event data from natural language
- Confidence scoring provides field-level accuracy metrics
- Service handles timezone detection and conversion
- Error handling for API failures and invalid inputs
- Performance meets requirement of processing within 5 seconds
- Service returns properly typed event data structure

## Tasks
- [ ] Set up OpenAI API account and obtain API key
- [ ] Configure `OPENAI_API_KEY` in environment variables
- [ ] Install OpenAI SDK package (`npm install openai`)
- [ ] Create `lib/ai.ts` service module
- [ ] Define `ExtractedEventData` TypeScript interface with confidence scores
- [ ] Implement `AIProcessingService` class with core methods
- [ ] Design comprehensive system prompt for event extraction
- [ ] Implement `extractEventDetails()` method with GPT-4 integration
- [ ] Add timezone context to prompt generation
- [ ] Implement field-level confidence scoring
- [ ] Add validation and enhancement logic for extracted data
- [ ] Create error handling for API failures and rate limits
- [ ] Add input sanitization and safety checks
- [ ] Implement retry logic with exponential backoff
- [ ] Create unit tests for core processing functions
- [ ] Test with various natural language inputs
- [ ] Optimize prompt engineering for accuracy and consistency
- [ ] User must sign off on functionality before story can be marked complete

## Notes
- Use GPT-4 for highest accuracy in structured data extraction
- Low temperature (0.1) for consistent JSON output
- Single comprehensive prompt preferred over multiple API calls
- Include current date/time context in prompts for relative date parsing
- Handle ambiguous inputs gracefully with clear confidence scores
- Consider implementing caching for similar inputs to reduce API costs 
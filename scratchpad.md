### Current Story

Story 041: Implement Image-based Event Extraction

### Current Task

Implement AIProcessingService.parseEventImage with TDD (unit tests + minimal implementation)

### Plan Checklist

- [ ] Write failing unit tests for parseEventImage (parse event extraction success, invalid JSON handling, buffer to base64 conversion)
- [ ] Implement parseEventImage method in lib/ai.ts to use OpenAI vision model
- [ ] Run unit tests and ensure they pass
- [ ] Ensure lint and type checks pass
- [ ] Update documentation as needed

## Future ToDo Items

- IS the table being updated when anyone uses the calendar parser? Every time soemone uses it, it should increment the count for that user. This is used by the daily 7am report on usage stats.
- Apparently gpt-4.1-nano can ALSO do image processing. We should try that.

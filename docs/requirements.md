# Project Requirements

**START CRITICAL NOTES -- DO NOT REMOVE**
- This document focuses on WHAT the system should do and WHY, not HOW it should be implemented.
- Keep this document formatted according to `requitements-template.md`
- Record every single user-given requirements that get into HOW instead of WHY below in the `Non-Requirements Detail` section.
- Ask the user if they should transition to the next phase if:
    - If we have enought requirements for an MVP.
    - If the user is moving past basic requirements into HOW to achieve the project goals.
- `scratchpad.mdc` will explain which script to run to transition to the next phase.
**END CRITICAL NOTES -- DO NOT REMOVE**


## Project Overview
The AI Calendar Helper is a personal tool designed to enhance the user's interaction with Google Calendar through two completely separate features:
1. Text-to-Calendar (Primary): Convert unstructured text to Google Calendar events with minimal steps
2. Novel Events Extraction (Secondary): Run scheduled background service to email summaries of upcoming novel calendar events

## Core Requirements (MVP)

### 1. Text-to-Calendar (Primary Feature)
- Accept unstructured text input describing an event
- Parse the text to extract:
  - Event title/name (with first line priority for title extraction)
  - Date and time
  - Duration (if specified)
  - Location (if specified)
  - Description/notes (if provided)
  - Attendees (if mentioned)
  - Conference call details (detect virtual meeting links or needs)
- Create a Google Calendar event with extracted information
- Allow minimal preview with simple editing options
- Provide direct creation into Google Calendar with minimal steps
- Support common date/time formats and expressions
- Auto-detect and handle timezone information
- Support recurring event creation when specified in text
- Provide confidence scoring for extracted fields
- Generate downloadable ICS file as alternative to direct calendar creation

### 2. Novel Events Extraction (Secondary Feature)
- System must connect to user's Google Calendar as a background service
- Run on a user-configured schedule
- Provide summaries of upcoming novel (non-recurring) calendar events
- Focus on novel/non-recurring events to reduce noise
- Deliver summaries via email in a clear, easy-to-read format
- Handle both date-only and datetime events appropriately
- Preserve timezone information for accurate event timing
- Simple configuration UI with:
  - Enable/disable toggle
  - Email recipient setting
  - Schedule configuration (time of day, frequency)
  - Parameters for what to include/exclude
- Maintain minimal local storage (no persistent event data)
- Ensure read-only access to calendar data for security

### Technical Requirements
- Secure Google Calendar API integration
- User authentication and authorization
- Reliable text parsing for event creation using AI
- Error handling for invalid or ambiguous inputs
- Fast processing time for text-to-calendar feature
- Efficient background processing for novel events extraction
- OAuth 2.0 implementation with secure credential storage
- Cross-platform compatibility
- Proper timezone handling for all calendar operations
- Strong data validation and error handling
- ICS file generation for calendar event sharing
- Email delivery service for novel events summaries

## Success Criteria
- Text-to-Calendar: Users can create calendar events by pasting in unstructured text with minimal steps
- Novel Events Extraction: Users receive email summaries of upcoming novel events on their configured schedule
- Accuracy in parsing event details from natural language
- Reduced time spent on manual calendar event creation
- Clear separation between the two main features in the UI
- Minimal user intervention needed for basic event creation

## Extended Features (Post-MVP)
- Smart categorization of events (meeting, social, travel, etc.)
- Multi-calendar support with smart calendar selection
- Attendee availability checking
- Conference call platform integration (Zoom, Teams, Google Meet)
- Batch event creation from a single text input (possible future enhancement)
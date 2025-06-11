# Story: Create text input UI component (MVP)

**Status**: To Do

---

## Related Requirement

[Text-to-Calendar Feature](../requirements.md#1-text-to-calendar-primary-feature) - Basic text input interface for natural language event parsing

## Alignment with Design

[UI/UX Design](../design.md#ui-design) - Simple, clean interface for text input and event parsing

## Acceptance Criteria (MVP)

- User can input natural language text in a large text area
- "Parse Events" button triggers processing (no calendar integration yet)
- Loading state shows while processing
- Results display in simple format (can be raw JSON initially)
- Basic error handling for empty input and processing failures
- Component integrates into existing authenticated app structure
- Responsive design works on mobile devices
- Component follows Material UI theming

## Tasks (MVP)

- [ ] Create `TextInputForm` component in `components/calendar/`
- [ ] Add large text area with placeholder text and examples
- [ ] Add "Parse Events" button with loading states
- [ ] Implement basic form validation (non-empty text)
- [ ] Create simple results display area
- [ ] Add error state handling
- [ ] Style with Material UI components consistent with app theme
- [ ] Make responsive for mobile
- [ ] Integrate component into dashboard or new page
- [ ] Create basic unit tests
- [ ] User sign-off on MVP functionality

## Notes (MVP)

- Keep it simple - focus on core input/output flow
- Results can display raw JSON initially before building fancy preview components
- No calendar integration buttons yet - that's Story 007
- No confidence scoring, editing, or advanced UX - those are later stories
- Goal is to prove the basic concept works before adding features
- This component will be the foundation for all other UI enhancements

## Out of Scope (For Later Stories)

- Event editing/preview cards (Story 006)
- Calendar integration buttons (Story 007)
- Confidence scoring (Story 009)
- Batch actions (Story 010)
- Advanced error handling (Story 014)
- Keyboard shortcuts (Story 017)

# AI Calendar Helper - Design Documentation

## Architecture Overview

The application follows a modern web architecture with:
- Server-side rendering using Next.js App Router
- React Server Components for optimal performance
- API routes for calendar operations
- Secure authentication flow
- Efficient data caching strategy

## Core Features

### 1. Text-to-Calendar
Primary feature that converts natural language into calendar events:
- Natural language processing for event details
- Smart date/time parsing
- Location and attendee detection
- Recurring event pattern recognition
- Direct Google Calendar integration

### 2. Novel Events Extraction
Background service for identifying and summarizing unique calendar events:
- Automated event analysis
- Pattern recognition for recurring vs. unique events
- Daily email summaries
- Customizable filtering options

## Data Flow

1. User Input Processing:
   ```
   Text Input -> NLP Processing -> Structured Data -> Calendar API -> Event Creation
   ```

2. Event Extraction:
   ```
   Calendar Data -> Event Analysis -> Pattern Detection -> Summary Generation -> Email Delivery
   ```

## Technical Decisions

### 1. Framework Selection
- **Next.js**: Chosen for:
  - Server-side rendering capabilities
  - API routes
  - TypeScript integration
  - Performance optimization features

### 2. Database Strategy
- **PostgreSQL**: Primary database for:
  - User preferences
  - Event templates
  - Application state
- **Redis**: Caching layer for:
  - Frequent queries
  - Rate limiting
  - Session management

### 3. Authentication
- **Firebase Authentication**:
  - OAuth 2.0 integration
  - Secure token management
  - Multiple provider support

### 4. UI/UX Principles
- Material Design inspired components
- Progressive enhancement
- Mobile-first approach
- Accessibility compliance

## Security Architecture

1. Authentication Layer:
   - JWT token validation
   - Role-based access control
   - Session management

2. Data Protection:
   - Input sanitization
   - API rate limiting
   - CORS policies
   - Data encryption

3. Error Handling:
   - Graceful degradation
   - User-friendly error messages
   - Detailed logging
   - Recovery procedures

## Scalability Considerations

1. Performance:
   - Component-level code splitting
   - Image optimization
   - Efficient caching strategies
   - Lazy loading

2. Database:
   - Connection pooling
   - Query optimization
   - Index management
   - Cache invalidation

3. API:
   - Rate limiting
   - Request queuing
   - Batch processing
   - Response compression

## Future Extensibility

1. Planned Features:
   - Advanced event suggestions
   - Multi-calendar support
   - Team calendar management
   - Custom event templates

2. Integration Points:
   - Additional calendar providers
   - Meeting platforms
   - CRM systems
   - Task management tools

## Monitoring and Maintenance

1. Performance Metrics:
   - Page load times
   - API response times
   - Error rates
   - User engagement

2. Health Checks:
   - Service availability
   - Database connections
   - Cache hit rates
   - Authentication status

## Project Structure

```
ai-calendar-helper/
├── app/                    # Next.js App Router directory
│   ├── layout.tsx         # Root layout with metadata configuration
│   └── page.tsx           # Home page component
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   │   ├── Button.tsx    # Reusable button component
│   │   ├── Card.tsx      # Card component with subcomponents
│   │   ├── Input.tsx     # Form input component
│   │   └── Label.tsx     # Form label component
│   ├── forms/            # Form-specific components
│   └── layouts/          # Layout components
├── lib/                  # Utility functions and configurations
│   └── env.ts           # Environment configuration
├── public/              # Static assets
└── styles/             # Global styles and theming
```

## Component Architecture

### UI Components

All UI components follow these principles:
- Use TypeScript for type safety
- Implement proper accessibility features
- Support theme customization
- Include proper prop documentation
- Use 'use client' directive when needed

#### Button Component
- Variants: default, destructive, outline, secondary, ghost, link
- Sizes: default, sm, lg, icon
- Full keyboard navigation support
- Loading state support

#### Card Component
- Subcomponents: Header, Title, Description, Content, Footer
- Variants: default, outline, ghost
- Flexible content layout
- Consistent spacing

#### Input Component
- Variants: default, outline, ghost
- Sizes: default, sm, lg
- Form integration support
- Validation state support

#### Label Component
- Variants: default, error, success
- Proper form association
- Screen reader support

## Configuration

### Metadata
- Separate viewport and metadata exports
- Theme color support for light/dark modes
- Proper SEO configuration

### Build Configuration
- Next.js 15.2.2 with TypeScript
- Turbopack experimental features
- Bundle analysis support

### Development Setup
- ESLint and Prettier integration
- TypeScript strict mode
- Development scripts:
  - `dev`: Development server
  - `build`: Production build
  - `start`: Production server
  - `lint`: Code linting

## Best Practices

1. **Component Organization**
   - Separate concerns between UI and logic
   - Use composition over inheritance
   - Implement proper prop typing

2. **Performance**
   - Use proper code splitting
   - Implement proper caching strategies
   - Optimize bundle size

3. **Accessibility**
   - ARIA labels where needed
   - Keyboard navigation support
   - Proper color contrast

4. **State Management**
   - Use React hooks effectively
   - Implement proper error boundaries
   - Handle loading states

## Next Steps

1. Implement remaining UI components
2. Set up authentication flow
3. Configure database connections
4. Implement API routes
5. Add PWA support

# Project Design

AI Calendar Helper

**Note**: This document outlines the technical design and implementation details (HOW), based on the requirements in `requirements.md`.

---

## Architecture Overview
The application will use a modern web application architecture with a backend service for calendar integration and natural language processing, and a clean web interface for user interactions. The application has two completely separate features: Text-to-Calendar (primary) and Novel Events Extraction (secondary/optional).

## Technology Stack
- Frontend:
  - Next.js for the web application (provides both client and server components)
  - React for UI components
  - TailwindCSS for styling
- Backend:
  - Node.js/TypeScript for the server
  - Google Calendar API for calendar integration
  - Natural Language Processing: GPT-4 API for text parsing (high accuracy for event details extraction)
  - Background service for scheduled novel events extraction
- Infrastructure:
  - fly.io for hosting (selected for existing account)
  - PostgreSQL for user preferences and configuration storage
  - Redis for rate limiting and caching frequent requests
  - Email service for novel events summary delivery

## Feature Implementations

### Feature: Text-to-Calendar (Primary Feature)
**Related Requirement**: [Natural Language Event Creation Section](docs/requirements.md)

The text-to-calendar feature will:
1. Text Processing Pipeline:
   - Initial text cleanup and normalization
   - GPT-4 API call for structured data extraction with prompt engineering for:
     - Accurate date/time parsing
     - Title extraction (prioritizing first line)
     - Location and attendee identification
     - Recurring event pattern detection
   - Validation and enrichment of extracted data
   - Direct event creation with Google Calendar API with minimal intermediary steps

2. Event Data Extraction:
   ```typescript
   interface ExtractedEventData {
     title: string;
     startTime: Date;
     endTime?: Date;
     duration?: number;
     location?: string;
     description?: string;
     attendees?: Array<{
       name: string;
       email?: string;
     }>;
     recurrence?: RecurrenceRule;
     timezone?: string;
     isConferenceCall: boolean;
     conferenceLink?: string;
     conferenceType?: 'zoom' | 'teams' | 'meet' | 'other';
     sourceText: string;           // Original text for reference
     confidence: {                 // Field-level confidence scores
       title: number;              // 0-1 score
       startTime: number;
       endTime: number;
       location: number;
       attendees: number;
       recurrence: number;
     };
   }
   ```

3. AI Processing Enhancement:
   ```typescript
   interface AIProcessingService {
     /**
      * Process text input to extract calendar event details
      */
     extractEventDetails(text: string, userTimezone: string): Promise<ExtractedEventData>;
     
     /**
      * Generate optimal prompt with context awareness
      */
     generateSystemPrompt(userTimezone: string, userPreferences: UserPreferences): string;
     
     /**
      * Validate and enhance the extracted event data
      */
     validateAndEnhance(event: ExtractedEventData): Promise<EnhancedEventData>;
     
     /**
      * Handle cases where information is missing or confidence is low
      */
     resolveAmbiguities(event: ExtractedEventData, requiredFields: string[]): Promise<ResolvedEventData>;
   }
   
   // Example implementation:
   class GPT4ProcessingService implements AIProcessingService {
     async extractEventDetails(text: string, userTimezone: string): Promise<ExtractedEventData> {
       const systemPrompt = this.generateSystemPrompt(userTimezone, userPreferences);
       
       // Single comprehensive prompt instead of parallel prompts
       const completion = await this.openai.createChatCompletion({
         model: "gpt-4",
         messages: [
           { role: "system", content: systemPrompt },
           { role: "user", content: text }
         ],
         temperature: 0.1, // Low temperature for consistent structured data
         response_format: { type: "json_object" }
       });
       
       return this.validateAndEnhance(completion.data.choices[0].message.content);
     }
     
     generateSystemPrompt(userTimezone: string, userPreferences: UserPreferences): string {
       const currentTime = new Date().toLocaleString('en-US', { timeZone: userTimezone });
       return `
         You are an AI assistant that extracts calendar event information from text.
         The current time is ${currentTime} in ${userTimezone}.
         
         Extract a calendar event with these fields:
         - title: Brief event name
         - startTime: When the event starts (ISO datetime)
         - endTime: When the event ends (ISO datetime)
         - location: Where the event takes place
         - description: Additional notes or details
         - attendees: List of people attending
         - isConferenceCall: Whether this is a virtual meeting
         - conferenceLink: Meeting link if provided
         - recurrence: Any recurring pattern
         
         For each field, include a confidence score (0-1) indicating your certainty.
         If information is missing, use null and explain why in a "missing_reason" field.
         
         Format the response as a JSON object.
         ${userPreferences.exampleFormat ? `Example format: ${userPreferences.exampleFormat}` : ''}
       `;
     }
     
     // Additional implementation methods...
   }
   ```

4. User Interface:
   - Clean text input area with instructions for the user
   - Minimal preview of extracted event details
   - Direct creation into Google Calendar
   - One-click ICS file download option

5. Simplified Event Preview:
   - Minimal display of essential event information
   - Basic editing for key fields if needed
   - Quick submission to Google Calendar
   - ICS file download option

### Feature: Novel Events Extraction (Background Service)
**Related Requirement**: [Daily Calendar Summary Section](docs/requirements.md)

The daily summary feature will:
1. Run as a scheduled background service:
   - Execute based on user-defined schedule
   - Fetch calendar events via Google Calendar API
   - Filter for novel (non-recurring) events
   - Generate email summary
   - Deliver to user's configured email address

2. Implement proven filtering logic from reference implementation:
   - Handle both date-only and datetime events
   - Proper timezone conversion and handling
   - Expansion of recurring events using `singleEvents=true`
   - Efficient date range parsing and validation
   - Support for customizable result limits

3. Enhanced caching strategy:
   - Store daily summaries in Redis with 1-hour TTL
   - Update cache when new events are created
   - Maintain no persistent event storage (following reference implementation)
   - Cache only processed summaries, not raw event data

4. Simple configuration UI:
   - Enable/disable toggle for the service
   - Email recipient configuration
   - Schedule settings (time of day, frequency)
   - Summary parameters (what to include/exclude)

5. Email delivery:
   - Well-formatted HTML email with event details
   - Chronological order of events
   - Clear categorization and highlighting
   - Mobile-friendly email layout

Implementation approach:
```typescript
interface EventSummary {
  date: string;
  events: NovelEvent[];
  totalEvents: number;
  categories: string[];
  dateRange: {
    start: string;
    end: string;
  };
  timezone: string;
}

interface NovelEventsExtractorConfig {
  enabled: boolean;
  emailAddress: string;
  schedule: 'daily' | 'weekdays' | 'weekends' | 'weekly';
  timeOfDay: string; // HH:MM format
  timeWindow: number; // days to look ahead
  excludedCategories: string[];
  maxResults: number;
}

interface DateRange {
  start: Date;
  end: Date;
}

class NovelEventsService {
  async executeExtraction(config: NovelEventsExtractorConfig): Promise<void> {
    if (!config.enabled) {
      return;
    }
    
    const dateRange = this.calculateDateRange(config);
    const events = await this.fetchFromGoogleCalendar({
      timeMin: dateRange.start.toISOString(),
      timeMax: dateRange.end.toISOString(),
      maxResults: config.maxResults,
      singleEvents: true,
      orderBy: 'startTime'
    });
    
    const novelEvents = this.filterNovelEvents(events, config);
    if (novelEvents.length > 0) {
      const summary = this.generateSummary(novelEvents, dateRange, config);
      await this.sendEmail(config.emailAddress, summary);
    }
  }
  
  private calculateDateRange(config: NovelEventsExtractorConfig): DateRange {
    // Calculate date range based on schedule configuration
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);
    end.setDate(end.getDate() + config.timeWindow);
    return { start, end };
  }
  
  private filterNovelEvents(events: CalendarEvent[], config: NovelEventsExtractorConfig): NovelEvent[] {
    // Filter out recurring events and apply category exclusions
    return events.filter(event => {
      // Check if it's a novel event (not recurring)
      const isNovel = !event.recurrence;
      
      // Check if it's in an excluded category
      const category = this.detectCategory(event);
      const isExcluded = config.excludedCategories.includes(category);
      
      return isNovel && !isExcluded;
    });
  }
  
  private async sendEmail(to: string, summary: EventSummary): Promise<void> {
    // Generate email from summary and send
    const emailHtml = this.generateEmailHtml(summary);
    await this.emailService.send({
      to,
      subject: `Novel Events Summary for ${summary.date}`,
      html: emailHtml
    });
  }
}
```

## User Interface Design

### Primary Landing Page: Text-to-Calendar
- Clean, minimal interface with:
  - Simple instructions for the user
  - Large text input area
  - "Create Event" button
  - ICS download option
  - Clear navigation to Novel Events Configuration page

### Secondary Page: Novel Events Configuration
- Simple configuration form with:
  - Enable/disable toggle
  - Email recipient field
  - Schedule selection (daily, weekdays, etc.)
  - Time of day preference
  - Include/exclude parameters
  - Save configuration button

### Event Preview Card (Simplified)
- Minimal Material Design card showing:
  - Event title and time
  - Location (if available)
  - Basic action buttons (Create/Download/Cancel)

### Mobile Responsiveness
- Responsive design for all screen sizes
- Touch-friendly interface
- Native share integration
- Progressive Web App support

## Performance Considerations
1. Client-side:
   - Debounced text processing
   - Simple, efficient UI with minimal state
   - Cached API responses
   - Progressive Web App capabilities

2. Server-side:
   - Redis caching for frequent queries
   - Background processing for novel events extraction
   - Rate limiting for API calls
   - Scheduled job management for email deliveries

## Security Measures
1. Authentication:
   - OAuth 2.0 with Google
   - Secure session management
   - CSRF protection

2. Data Protection:
   - End-to-end encryption for sensitive data
   - Rate limiting per user
   - Input sanitization
   - Audit logging

## Error Handling
1. User-facing Errors:
   ```typescript
   class ErrorHandler {
     /**
      * Handle and normalize AI processing errors
      */
     handleAIProcessingError(error: any): UserFacingError {
       if (error.type === 'api_error') {
         return {
           message: "Sorry, we couldn't process your text right now. Please try again.",
           suggestedAction: "Try again or simplify your input text.",
           severity: "error",
           code: "AI_PROCESSING_FAILED"
         };
       }
       
       if (error.type === 'validation_error') {
         return {
           message: `We couldn't understand some details: ${error.details.join(', ')}`,
           suggestedAction: "Please provide more details or correct the information.",
           severity: "warning",
           code: "VALIDATION_FAILED",
           fieldErrors: error.fieldErrors
         };
       }
       
       // Default error handling
       return {
         message: "Something went wrong. Please try again.",
         suggestedAction: "Refresh the page or try again later.",
         severity: "error",
         code: "UNKNOWN_ERROR"
       };
     }
     
     /**
      * Handle calendar API errors
      */
     handleCalendarError(error: any): UserFacingError {
       // Specific error handling based on Google Calendar API errors
       if (error.code === 403) {
         return {
           message: "You don't have permission to access this calendar.",
           suggestedAction: "Try a different calendar or check your permissions.",
           severity: "error",
           code: "CALENDAR_PERMISSION_DENIED"
         };
       }
       
       // Other specific error handling
       return {
         message: "Unable to access your calendar right now.",
         suggestedAction: "Check your internet connection or try again later.",
         severity: "error",
         code: "CALENDAR_ACCESS_FAILED"
       };
     }
   }
   ```

2. System Errors:
   - Graceful degradation
   - Automatic retry mechanisms
   - Error tracking and monitoring
   - Admin notifications for critical issues

class TimezoneService {
  /**
   * Detect timezone from location string
   */
  async detectFromLocation(location: string): Promise<string> {
    try {
      // Use geocoding API to get coordinates
      const coordinates = await this.geocodeLocation(location);
      
      // Use timezone API to get IANA timezone
      const timezone = await this.getTimezoneFromCoordinates(coordinates);
      
      return timezone;
    } catch (error) {
      // Fallback to user's default timezone
      return this.getUserDefaultTimezone();
    }
  }
  
  /**
   * Validate if a timezone string is a valid IANA timezone
   */
  validateTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get user's default timezone
   */
  getUserDefaultTimezone(): string {
    // Get from user preferences or detect from browser
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  
  /**
   * Convert a date to a specific timezone
   */
  convertToTimezone(date: Date, timezone: string): Date {
    // Use Intl API to format a date in a specific timezone
    return new Date(
      new Date(date).toLocaleString('en-US', { timeZone: timezone })
    );
  }
}

## Authentication Design

### Implementation Details
- Firebase Authentication with Google Sign-in
- Custom session management using HTTP-only cookies
- Protected routes using middleware
- Server-side token verification

### Components
1. SignInButton (`components/auth/SignInButton.tsx`)
   - Handles Google sign-in flow
   - Manages sign-out functionality
   - Automatic state management
   - Loading states during authentication

2. UserProfile (`components/auth/UserProfile.tsx`)
   - Displays authenticated user information
   - Shows Google profile picture
   - Dark theme compatible card design
   - Integrated sign-out functionality

### API Routes
1. Session Management (`app/api/auth/session/route.ts`)
   - POST: Creates session from Firebase ID token
   - DELETE: Removes session cookie
   - Server-side token verification
   - Secure cookie management

### Middleware (`middleware.ts`)
- Protects routes based on session cookie
- Redirects unauthenticated users to login
- Lightweight cookie checking
- No token verification in middleware (done in API)

### Security Considerations
1. Token Security
   - Firebase ID tokens verified server-side
   - HTTP-only cookies for session storage
   - Secure cookie flags in production

2. Firebase Admin SDK
   - Only used in API routes
   - Environment variables properly secured
   - Service account key properly managed

3. Client-side Security
   - Public Firebase config only
   - No sensitive operations in browser
   - Protected route patterns
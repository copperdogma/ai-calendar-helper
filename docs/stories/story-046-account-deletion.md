# Story 046: Account Deletion Feature

**Priority**: High  
**Status**: Planning  
**Estimate**: 4-6 hours  
**Epic**: Phase 5: UI/UX & Polish

## Problem Statement

Users need the ability to permanently delete their accounts and all associated data to comply with GDPR "right to be forgotten" requirements and Apple iOS account deletion guidelines. Currently, users have no way to remove their data from the system.

## User Story

**As a** registered user  
**I want** the ability to permanently delete my account and all associated data  
**So that** I can exercise my right to data privacy and remove my information when I no longer want to use the service

## Acceptance Criteria

### Functional Requirements

#### UI Components

- [ ] **Delete Account Button**: Add prominently placed "Delete Account" button to the /profile page
- [ ] **Two-Step Confirmation**: Initial button click opens confirmation dialog (prevents accidental clicks)
- [ ] **Typing Confirmation**: User must type "DELETE" in the dialog to confirm (prevents accidental deletion)
- [ ] **Clear Warning Messages**: Dialog explains exactly what will be deleted and that action is irreversible
- [ ] **Loading States**: Show appropriate loading indicators during deletion process
- [ ] **Error Handling**: Display clear error messages if deletion fails

#### Backend Operations

- [ ] **Complete Data Deletion**: Remove ALL user data from every database table
- [ ] **Transactional Integrity**: All-or-nothing deletion (if any part fails, nothing is deleted)
- [ ] **Session Management**: Automatically sign out user and redirect to login page after successful deletion
- [ ] **Identity Validation**: Verify the authenticated user matches the account being deleted
- [ ] **Audit Logging**: Log deletion events for compliance and debugging

#### Data Scope (Tables to Clean Up)

- [ ] **User** (primary record - triggers CASCADE for most related tables)
- [ ] **Account** (OAuth accounts - CASCADE configured ✅)
- [ ] **Session** (user sessions - CASCADE configured ✅)
- [ ] **ServiceUsage** (usage tracking - CASCADE configured ✅)
- [ ] **UsageEvent** (analytics events - CASCADE configured ✅)
- [ ] **CalendarSyncState** (calendar sync data - CASCADE configured ✅)
- [ ] **UserSettings** (user preferences - CASCADE configured ✅)
- [ ] **UserJobSchedule** (scheduled jobs - CASCADE configured ✅)
- [ ] **JobFailure** (requires special handling due to retriedBy relation)

### Technical Requirements

#### Security & Compliance

- [ ] **GDPR Compliance**: Meet Article 17 "right to erasure" requirements
- [ ] **Apple iOS Compliance**: Meet App Store account deletion requirements
- [ ] **Prevent Accidental Deletion**: Require explicit confirmation with typing barrier
- [ ] **User Identity Verification**: Ensure only account owner can delete their account
- [ ] **Audit Trail**: Maintain logs for legal compliance (without storing deleted user data)

#### Performance & Reliability

- [ ] **Transactional Operations**: Use database transactions to ensure consistency
- [ ] **Error Recovery**: Graceful handling if deletion fails partway through
- [ ] **Timeout Handling**: Handle long-running deletion operations appropriately
- [ ] **Concurrent Safety**: Handle edge cases if user has multiple active sessions

### User Experience Requirements

#### Workflow Design

1. **Initial Action**: User clicks "Delete Account" button on profile page
2. **Confirmation Dialog**: Modal opens with clear warning and typing confirmation
3. **Typing Barrier**: User must type "DELETE" to enable confirmation button
4. **Processing State**: Show loading indicator during deletion
5. **Completion**: Automatic sign-out and redirect to login with success message

#### UI/UX Specifications

- [ ] **Button Placement**: Place in ProfileDetailsSection after other account actions
- [ ] **Destructive Styling**: Use error/destructive color scheme for button and dialog
- [ ] **Clear Messaging**: Explain data deletion scope and irreversibility
- [ ] **Accessibility**: Proper ARIA labels and keyboard navigation
- [ ] **Mobile Responsive**: Works properly on mobile devices

## Technical Design

### Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ DeleteAccount   │───▶│ DeleteAccount   │───▶│ ProfileService  │
│ Button          │    │ Dialog          │    │ .deleteAccount()│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                                               ┌─────────────────┐
                                               │ Database        │
                                               │ Transaction     │
                                               └─────────────────┘
```

### Implementation Components

#### Frontend Components

1. **DeleteAccountButton** (`app/profile/components/DeleteAccountButton.tsx`)

   - Destructive styling button
   - Opens confirmation dialog on click
   - Follows SignOutButton pattern

2. **DeleteAccountDialog** (`app/profile/components/DeleteAccountDialog.tsx`)
   - Modal dialog with typing confirmation
   - Clear warning messages
   - Uses existing Dialog component system

#### Backend Services

1. **ProfileService.deleteAccount()** (`lib/server/services/profile.service.ts`)

   - Transactional user data deletion
   - Special handling for JobFailure relations
   - Comprehensive error handling and logging

2. **Server Action** (`app/profile/actions.ts`)
   - deleteAccount server action
   - Session validation
   - Integration with ProfileService

### Database Operations

#### Primary Deletion Strategy

```sql
-- Most tables have CASCADE configured, so deleting User triggers cleanup
DELETE FROM "User" WHERE id = $userId;
```

#### Special Handling Required

```sql
-- JobFailure table has complex relations requiring manual cleanup
UPDATE "JobFailure" SET "retriedBy" = NULL WHERE "retriedBy" = $userId;
DELETE FROM "JobFailure" WHERE "userId" = $userId;
DELETE FROM "User" WHERE id = $userId;
```

## Implementation Plan

### Phase 1: Backend Foundation (2 hours)

- [ ] Extend ProfileService with deleteAccount method
- [ ] Implement database transaction logic for JobFailure cleanup
- [ ] Add comprehensive logging and error handling
- [ ] Create server action in profile/actions.ts
- [ ] Add unit tests for ProfileService method

### Phase 2: UI Components (2 hours)

- [ ] Create DeleteAccountButton component
- [ ] Create DeleteAccountDialog with typing confirmation
- [ ] Integrate components into ProfileDetailsSection
- [ ] Add loading states and error handling
- [ ] Style with destructive/error theme

### Phase 3: Integration & Testing (1-2 hours)

- [ ] Implement session cleanup and redirect logic
- [ ] Add integration tests for deletion flow
- [ ] Add E2E tests for complete user journey
- [ ] Test error scenarios and edge cases

## Testing Strategy

### Unit Tests

- [ ] **ProfileService.deleteAccount()**: Test successful deletion, error handling, transaction rollback
- [ ] **DeleteAccountButton**: Test UI interactions and state management
- [ ] **DeleteAccountDialog**: Test typing confirmation logic

### Integration Tests

- [ ] **Complete Deletion Flow**: Verify all user data is removed from all tables
- [ ] **Transaction Integrity**: Test rollback on partial failures
- [ ] **Session Management**: Verify automatic sign-out and redirect

### E2E Tests

- [ ] **Happy Path**: Complete account deletion workflow from UI to database
- [ ] **Confirmation Barriers**: Test that typing confirmation is required
- [ ] **Error Scenarios**: Test handling of deletion failures

## Security Considerations

### Data Privacy Compliance

- **GDPR Article 17**: Implements "right to erasure" with complete data removal
- **Audit Trail**: Logs deletion events without storing deleted personal data
- **Immediate Effect**: No grace period - deletion is permanent and immediate

### Security Measures

- **User Identity Validation**: Only authenticated account owner can delete
- **Session Verification**: Verify user session matches deletion target
- **Confirmation Barriers**: Prevent accidental deletion with typing requirement
- **Transactional Safety**: All-or-nothing deletion prevents partial data removal

## Dependencies

### Technical Dependencies

- **Existing ProfileService**: Extends current user update patterns
- **Dialog Components**: Uses established dialog system
- **Database Transactions**: Leverages existing transaction utilities
- **Authentication**: Requires NextAuth.js session validation

### User Experience Dependencies

- **Profile Page**: Must be accessible from /profile page
- **Session Management**: Integrates with current authentication flow

## Success Metrics

### Functional Success

- [ ] **Complete Data Removal**: 100% of user data removed from all tables
- [ ] **Zero Failed Deletions**: All attempted deletions complete successfully
- [ ] **Proper Session Cleanup**: Users automatically signed out after deletion

### User Experience Success

- [ ] **Accidental Deletion Prevention**: No reports of unintended account deletion
- [ ] **Clear User Understanding**: Users understand deletion scope and consequences
- [ ] **Smooth Workflow**: Deletion process completed within 30 seconds

### Compliance Success

- [ ] **GDPR Compliance**: Meets "right to erasure" requirements
- [ ] **Apple iOS Compliance**: Satisfies App Store account deletion guidelines
- [ ] **Audit Trail**: Complete logs for compliance verification

## Risk Mitigation

### Data Loss Risks

- **Mitigation**: Clear warnings and typing confirmation prevent accidental deletion
- **Contingency**: Comprehensive logging allows investigation of any issues

### Technical Risks

- **Mitigation**: Transactional operations ensure consistent state
- **Contingency**: Rollback mechanisms prevent partial data deletion

### Compliance Risks

- **Mitigation**: Complete data removal and audit trail ensure compliance
- **Contingency**: Regular compliance review and testing

## Future Enhancements (Out of Scope)

These features are explicitly excluded from the current implementation but could be added later:

- **Data Export**: Allow users to download their data before deletion
- **Grace Period**: 30-day recovery period before permanent deletion
- **Deletion Feedback**: Survey asking why users are deleting their account
- **Admin Override**: Administrative ability to recover deleted accounts
- **Deletion Scheduling**: Allow users to schedule future deletion

## Notes

### Design Decisions Made

- **Immediate Deletion**: User preference for no grace period
- **Typing Confirmation**: User preference for "DELETE" typing requirement
- **No Data Export**: Excluded to keep scope manageable for MVP
- **No Feedback Collection**: Excluded to reduce user friction

### Implementation Notes

- **CASCADE Relationships**: Most database cleanup handled automatically
- **JobFailure Special Case**: Requires manual cleanup due to retriedBy relation
- **Session Management**: Automatic sign-out prevents security issues
- **Error Handling**: Follows established patterns in ProfileService

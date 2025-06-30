'use client';

import { Button } from '@/components/ui/Button';
import { WarningAmber } from '@mui/icons-material';

interface DeleteAccountButtonProps {
  /**
   * Click handler for the delete account button
   */
  onClick: () => void;
  /**
   * Whether the button is in loading state
   */
  isLoading?: boolean;
  /**
   * Whether the button is disabled
   */
  disabled?: boolean;
  /**
   * Custom loading text to display when isLoading is true
   */
  loadingText?: string;
}

/**
 * Delete Account Button Component
 *
 * A destructive button for initiating account deletion.
 * Follows the same patterns as SignOutButton with error styling.
 *
 * Features:
 * - Destructive error styling
 * - Warning icon
 * - Loading states
 * - Proper accessibility
 * - Test ID for E2E testing
 */
export default function DeleteAccountButton({
  onClick,
  isLoading = false,
  disabled = false,
  loadingText = 'Deleting...',
}: DeleteAccountButtonProps) {
  return (
    <Button
      type="button"
      variant="contained"
      color="error"
      onClick={onClick}
      startIcon={<WarningAmber />}
      size="large"
      isLoading={isLoading}
      loadingText={loadingText}
      disabled={disabled}
      data-testid="delete-account-button"
    >
      Delete Account
    </Button>
  );
}

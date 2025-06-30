'use client';

import { useState, useTransition } from 'react';
import { Box, Typography } from '@mui/material';
import { WarningAmber } from '@mui/icons-material';
import Dialog from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { deleteAccount } from '@/app/profile/actions';

interface DeleteAccountDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;
  /**
   * Callback when dialog should be closed
   */
  onClose: () => void;
  /**
   * Callback when account is successfully deleted
   */
  onAccountDeleted: () => void;
}

/**
 * Delete Account Confirmation Dialog
 *
 * A destructive confirmation dialog that requires the user to type "DELETE"
 * to confirm account deletion. Features:
 *
 * - Requires typing "DELETE" (case-sensitive) to enable deletion
 * - Clear warning messages about data loss
 * - Loading states during deletion
 * - Error handling and display
 * - Proper accessibility support
 * - Server action integration
 */
export default function DeleteAccountDialog({
  open,
  onClose,
  onAccountDeleted,
}: DeleteAccountDialogProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isConfirmationValid = confirmationText === 'DELETE';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isConfirmationValid) {
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('confirmationText', confirmationText);

        const result = await deleteAccount(formData);

        if (result.status === 'success') {
          onAccountDeleted();
        } else {
          setError(result.message || 'Failed to delete account');
        }
      } catch {
        setError('An unexpected error occurred');
      }
    });
  };

  const handleClose = () => {
    if (!isPending) {
      setConfirmationText('');
      setError(null);
      onClose();
    }
  };

  const actions = (
    <>
      <Button variant="outlined" onClick={handleClose} disabled={isPending}>
        Cancel
      </Button>
      <Button
        type="submit"
        form="delete-account-form"
        variant="contained"
        color="error"
        startIcon={<WarningAmber />}
        disabled={!isConfirmationValid || isPending}
        isLoading={isPending}
        loadingText="Deleting..."
      >
        Delete Account
      </Button>
    </>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Delete Account"
      actions={actions}
      maxWidth="sm"
      data-testid="delete-account-dialog"
    >
      <Box sx={{ py: 2 }}>
        {/* Warning Section */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <WarningAmber color="error" sx={{ mt: 0.5, flexShrink: 0 }} />
          <Box>
            <Typography variant="body1" color="error" sx={{ fontWeight: 'medium', mb: 1 }}>
              This action cannot be undone.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All your data will be permanently removed from our servers, including your profile,
              settings, and any associated information. You will be immediately signed out.
            </Typography>
          </Box>
        </Box>

        {/* Confirmation Form */}
        <form id="delete-account-form" onSubmit={handleSubmit}>
          <Typography variant="body2" sx={{ mb: 2, fontWeight: 'medium' }}>
            Type <strong>DELETE</strong> to confirm:
          </Typography>

          <input
            type="text"
            placeholder="DELETE"
            value={confirmationText}
            onChange={e => setConfirmationText(e.target.value)}
            disabled={isPending}
            required
            autoFocus
            aria-label="Type DELETE to confirm account deletion"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '16px',
              marginBottom: '16px',
              outline: 'none',
            }}
          />

          {/* Error Display */}
          {error && (
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </form>
      </Box>
    </Dialog>
  );
}

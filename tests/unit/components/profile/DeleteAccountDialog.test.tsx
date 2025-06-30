import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import DeleteAccountDialog from '@/app/profile/components/DeleteAccountDialog';

// Mock the server action
jest.mock('@/app/profile/actions', () => ({
  deleteAccount: jest.fn(),
}));

describe('DeleteAccountDialog', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onAccountDeleted: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when open', () => {
    // Arrange & Act
    render(<DeleteAccountDialog {...defaultProps} />);

    // Assert
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /delete account/i })).toBeInTheDocument();
    expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    // Arrange & Act
    render(<DeleteAccountDialog {...defaultProps} open={false} />);

    // Assert
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('displays warning content and confirmation instructions', () => {
    // Arrange & Act
    render(<DeleteAccountDialog {...defaultProps} />);

    // Assert
    expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
    expect(screen.getByText(/Type/)).toBeInTheDocument();
    expect(screen.getByText(/to confirm:/)).toBeInTheDocument();
    expect(screen.getByText(/all your data will be permanently removed/i)).toBeInTheDocument();
  });

  it('has confirmation text input field', () => {
    // Arrange & Act
    render(<DeleteAccountDialog {...defaultProps} />);

    // Assert
    const input = screen.getByLabelText(/type.*delete.*to confirm/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'DELETE');
  });

  it('has cancel and delete buttons', () => {
    // Arrange & Act
    render(<DeleteAccountDialog {...defaultProps} />);

    // Assert
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    const deleteButton = screen.getByRole('button', { name: /delete account/i });

    expect(cancelButton).toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();
  });

  it('delete button is disabled initially', () => {
    // Arrange & Act
    render(<DeleteAccountDialog {...defaultProps} />);

    // Assert
    const deleteButton = screen.getByRole('button', { name: /delete account/i });
    expect(deleteButton).toBeDisabled();
  });

  it('enables delete button when "DELETE" is typed correctly', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<DeleteAccountDialog {...defaultProps} />);

    // Act
    const input = screen.getByLabelText(/type.*delete.*to confirm/i);
    await user.type(input, 'DELETE');

    // Assert
    const deleteButton = screen.getByRole('button', { name: /delete account/i });
    expect(deleteButton).not.toBeDisabled();
  });

  it('keeps delete button disabled when incorrect text is typed', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<DeleteAccountDialog {...defaultProps} />);

    // Act
    const input = screen.getByLabelText(/type.*delete.*to confirm/i);
    await user.type(input, 'delete'); // lowercase

    // Assert
    const deleteButton = screen.getByRole('button', { name: /delete account/i });
    expect(deleteButton).toBeDisabled();
  });

  it('calls onClose when cancel button is clicked', async () => {
    // Arrange
    const mockOnClose = jest.fn();
    const user = userEvent.setup();
    render(<DeleteAccountDialog {...defaultProps} onClose={mockOnClose} />);

    // Act
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    // Assert
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button (X) is clicked', async () => {
    // Arrange
    const mockOnClose = jest.fn();
    const user = userEvent.setup();
    render(<DeleteAccountDialog {...defaultProps} onClose={mockOnClose} />);

    // Act
    const closeButton = screen.getByLabelText(/close dialog/i);
    await user.click(closeButton);

    // Assert
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('shows loading state during deletion', async () => {
    // Arrange
    const user = userEvent.setup();
    const { deleteAccount } = require('@/app/profile/actions');

    // Mock the server action to return a pending promise
    deleteAccount.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<DeleteAccountDialog {...defaultProps} />);

    // Act
    const input = screen.getByLabelText(/type.*delete.*to confirm/i);
    await user.type(input, 'DELETE');

    const deleteButton = screen.getByRole('button', { name: /delete account/i });
    await user.click(deleteButton);

    // Assert
    expect(screen.getByRole('button', { name: /deleting\.\.\./i })).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('submits form with correct confirmation text', async () => {
    // Arrange
    const user = userEvent.setup();
    const { deleteAccount } = require('@/app/profile/actions');
    const mockOnAccountDeleted = jest.fn();

    deleteAccount.mockResolvedValue({ status: 'success' });

    render(<DeleteAccountDialog {...defaultProps} onAccountDeleted={mockOnAccountDeleted} />);

    // Act
    const input = screen.getByLabelText(/type.*delete.*to confirm/i);
    await user.type(input, 'DELETE');

    const deleteButton = screen.getByRole('button', { name: /delete account/i });
    await user.click(deleteButton);

    // Assert
    expect(deleteAccount).toHaveBeenCalledWith(expect.any(FormData));
  });

  it('calls onAccountDeleted on successful deletion', async () => {
    // Arrange
    const user = userEvent.setup();
    const { deleteAccount } = require('@/app/profile/actions');
    const mockOnAccountDeleted = jest.fn();

    deleteAccount.mockResolvedValue({ status: 'success' });

    render(<DeleteAccountDialog {...defaultProps} onAccountDeleted={mockOnAccountDeleted} />);

    // Act
    const input = screen.getByLabelText(/type.*delete.*to confirm/i);
    await user.type(input, 'DELETE');

    const deleteButton = screen.getByRole('button', { name: /delete account/i });
    await user.click(deleteButton);

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    // Assert
    expect(mockOnAccountDeleted).toHaveBeenCalledTimes(1);
  });

  it('displays error message on deletion failure', async () => {
    // Arrange
    const user = userEvent.setup();
    const { deleteAccount } = require('@/app/profile/actions');

    deleteAccount.mockResolvedValue({
      status: 'error',
      message: 'Failed to delete account',
    });

    render(<DeleteAccountDialog {...defaultProps} />);

    // Act
    const input = screen.getByLabelText(/type.*delete.*to confirm/i);
    await user.type(input, 'DELETE');

    const deleteButton = screen.getByRole('button', { name: /delete account/i });
    await user.click(deleteButton);

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    // Assert
    expect(screen.getByText(/failed to delete account/i)).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    // Arrange & Act
    render(<DeleteAccountDialog {...defaultProps} />);

    // Assert
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby');
    expect(dialog).toHaveAttribute('aria-describedby');

    const input = screen.getByLabelText(/type.*delete.*to confirm/i);
    expect(input).toHaveAttribute('required');
  });

  it('has proper test id for E2E testing', () => {
    // Arrange & Act
    render(<DeleteAccountDialog {...defaultProps} />);

    // Assert
    expect(screen.getByTestId('delete-account-dialog')).toBeInTheDocument();
  });
});

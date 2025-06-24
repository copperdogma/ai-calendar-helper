import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimezoneSelector from '@/components/ui/TimezoneSelector';

// Ensures the searchable dropdown works and remains compact initially.

describe('TimezoneSelector searchable dropdown', () => {
  it('reveals a search box on open and filters options as the user types', async () => {
    const user = userEvent.setup();
    render(<TimezoneSelector />);

    // The search input should NOT exist before opening.
    expect(screen.queryByTestId('tz-search-input')).toBeNull();

    // Open the select.
    const combobox = screen.getByLabelText('Timezone');
    await user.click(combobox);

    // Search input should now appear and be focused.
    const searchInput = await screen.findByTestId('tz-search-input');
    expect(searchInput).toBeInTheDocument();

    // Type a partial query.
    await user.type(searchInput, 'vancouver');

    // Expect America/Vancouver to be in the filtered list and visible.
    const option = await screen.findByTestId('tz-option-America/Vancouver');
    expect(option).toBeInTheDocument();

    // Click the option to select.
    await user.click(option);

    // The combobox should now show the selected timezone.
    expect(screen.getByLabelText('Timezone')).toHaveTextContent('America/Vancouver');
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimezoneSelector from '@/components/ui/TimezoneSelector';

describe('TimezoneSelector', () => {
  it('allows user to change timezone state', async () => {
    const user = userEvent.setup();

    render(<TimezoneSelector />);

    // Open the select field
    const selectInput = screen.getByLabelText('Timezone');
    await user.click(selectInput);

    // Choose the first available option
    const options = await screen.findAllByRole('option');
    expect(options.length).toBeGreaterThan(0);
    const firstOption = options[0];
    const value = firstOption.getAttribute('data-value') || firstOption.textContent || '';

    await user.click(firstOption);

    // Select component should now show chosen value
    expect(screen.getByLabelText('Timezone')).toHaveTextContent(value);
  });
});

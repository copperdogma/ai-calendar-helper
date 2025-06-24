import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimezoneSelector from '@/components/ui/TimezoneSelector';

describe('TimezoneSelector', () => {
  it('allows user to change timezone state', async () => {
    const user = userEvent.setup();

    render(<TimezoneSelector />);

    // Open the select field
    const [selectInput] = screen.getAllByLabelText('Timezone');
    await user.click(selectInput);

    // Choose the first available option
    const options = await screen.findAllByRole('option');
    const firstOption = options.find(o => o.getAttribute('data-value')) as HTMLElement;
    const value = firstOption.getAttribute('data-value') as string;

    await user.click(firstOption);

    // Select component should now show chosen value
    expect(screen.getAllByLabelText('Timezone')[0]).toHaveTextContent(value);
  });
});

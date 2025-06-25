import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimezoneSelector from '@/components/ui/TimezoneSelector';

describe('TimezoneSelector keyboard navigation', () => {
  it('ArrowDown from search moves focus to first option', async () => {
    const user = userEvent.setup();
    render(<TimezoneSelector />);

    // open select
    const combobox = screen.getByLabelText('Timezone');
    await user.click(combobox);

    await screen.findByTestId('tz-search-input');

    // press ArrowDown
    await user.keyboard('{ArrowDown}');

    // active element should now be first option in listbox
    const firstOption = screen
      .getAllByRole('option')
      .find(el => el.getAttribute('data-value')) as HTMLElement;
    expect(document.activeElement).toBe(firstOption);
  });
});

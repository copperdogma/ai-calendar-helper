import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimezoneProvider from '@/lib/providers/TimezoneProvider';
import TimezoneSelector from '@/components/ui/TimezoneSelector';
import { useTimezone } from '@/lib/hooks/useTimezone';

function DisplayTz() {
  const { timezone } = useTimezone();
  return <div data-testid="active-tz">{timezone}</div>;
}

describe('TimezoneProvider context', () => {
  it('propagates timezone changes to descendants', async () => {
    const user = userEvent.setup();

    render(
      <TimezoneProvider>
        <TimezoneSelector />
        <DisplayTz />
      </TimezoneProvider>
    );

    // Ensure initial timezone is rendered
    const initial = screen.getByTestId('active-tz').textContent;
    expect(initial).not.toEqual('');

    // change
    await user.click(screen.getByLabelText('Timezone'));
    const options = await screen.findAllByRole('option');
    const second = options[1];
    const newTz = second.getAttribute('data-value') || second.textContent || '';
    await user.click(second);

    expect(screen.getByTestId('active-tz')).toHaveTextContent(newTz);
  });
});

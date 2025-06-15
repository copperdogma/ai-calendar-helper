'use client';

import React, { createContext } from 'react';
import { useTimezone } from '@/lib/hooks/useTimezone';

export interface TimezoneContextValue {
  timezone: string;
  setTimezone: (tz: string) => void;
}

export const TimezoneContext = createContext<TimezoneContextValue | undefined>(undefined);

export default function TimezoneProvider({ children }: { children: React.ReactNode }) {
  const { timezone, setTimezone } = useTimezone();

  const value = React.useMemo(() => ({ timezone, setTimezone }), [timezone, setTimezone]);

  return <TimezoneContext.Provider value={value}>{children}</TimezoneContext.Provider>;
}

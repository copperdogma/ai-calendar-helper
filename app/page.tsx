// app/page.tsx
// Root path now simply redirects to the Calendar Parser page.
// Any further authentication handling is delegated to NextAuth middleware,
// which will redirect unauthenticated users to /login with a callback.

import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Calendar Helper - Smart Event Parsing',
  description:
    'Transform natural language into calendar events with AI-powered parsing. Supports Google Calendar, Outlook, and Apple Calendar integration.',
};

export default function RootRedirectPage() {
  redirect('/calendar-parser');
}

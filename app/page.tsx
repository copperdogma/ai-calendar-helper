// app/page.tsx
// Root path now simply redirects to the Calendar Parser page.
// Any further authentication handling is delegated to NextAuth middleware,
// which will redirect unauthenticated users to /login with a callback.

import { redirect } from 'next/navigation';

export default function RootRedirectPage() {
  redirect('/calendar-parser');
}

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Profile | {{YOUR_APP_TITLE}}',
  description: 'View and manage your user profile details and settings.',
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - AI Calendar Helper',
  description: 'Sign in to your AI Calendar Helper account to start parsing events.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

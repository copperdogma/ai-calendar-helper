import { Metadata } from 'next';
import LoginPageClient from './LoginPageClient';

export const metadata: Metadata = {
  title: 'Login - AI Calendar Helper',
  description: 'Sign in to your AI Calendar Helper account to start parsing events.',
};

export default function LoginPage() {
  return <LoginPageClient />;
}

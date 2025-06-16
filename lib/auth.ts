// ============================================================================
// NextAuth Main Configuration
// ============================================================================

// Main NextAuth import - This SHOULD contain augmented types via next-auth.d.ts
import NextAuth from 'next-auth';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

// Import the Node.js-compatible configuration
import { authConfigNode } from './auth-node';

// Generate a correlation ID for this initialization
const correlationId = uuidv4();

logger.info({
  msg: 'Initializing NextAuth',
  correlationId,
  env: process.env.NODE_ENV,
  component: 'auth',
});

// ------------------------------------------------------------
// Initialize NextAuth with the configuration.
// next-auth@5 has gone through several beta iterations that
// changed the exact return shape of the `NextAuth()` helper.
// In some versions we receive `{ handlers, auth, signIn, … }`,
// in others the `GET` / `POST` route handlers are exported at
// the top-level (e.g. `{ GET, POST, auth, signIn, … }`).
//
// The code below normalises these differences so that the
// rest of the application can safely import `handlers`.
// ------------------------------------------------------------

// Raw result from NextAuth – could be one of several shapes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nextAuthResult: any = NextAuth(authConfigNode);

// 1. Extract the core pieces that we always expect to exist.
const auth = nextAuthResult.auth ?? nextAuthResult.auth?.bind?.(nextAuthResult);
const signIn = nextAuthResult.signIn;
const signOut = nextAuthResult.signOut;

// 2. Build a consistent `handlers` object so downstream
//    consumers (e.g. our route file) can rely on it.
const handlers = nextAuthResult.handlers ?? {
  GET: nextAuthResult.GET,
  POST: nextAuthResult.POST,
};

logger.info({
  msg: 'NextAuth initialized successfully',
  correlationId,
  env: process.env.NODE_ENV,
  component: 'auth',
});

export { handlers, auth, signIn, signOut };

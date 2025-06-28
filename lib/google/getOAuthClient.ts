/* eslint-disable @typescript-eslint/no-explicit-any */
// googleapis is optional in many local/dev environments – load lazily

import { PrismaClient } from '@prisma/client';

/**
 * Returns an authenticated OAuth2 client for the given user, using stored tokens in the Account table.
 * Throws if credentials or tokens are missing.
 */
export async function getUserOAuthClient(userId: string, prisma: PrismaClient) {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth client credentials not configured');
  }

  // NextAuth stores provider accounts in the Account table
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: 'google',
    },
  });

  if (!account || !account.access_token) {
    throw new Error('Google account or tokens not found for user');
  }

  // Dynamically import googleapis only when this helper is invoked
  let googleApi: any;
  try {
    googleApi = await eval("import('googleapis')");
  } catch {
    throw new Error('googleapis package not installed on server');
  }

  const { google } = googleApi as { google: any };

  const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  oauth2Client.setCredentials({
    access_token: account.access_token as string,
    refresh_token: account.refresh_token ?? undefined,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
    scope: account.scope ?? undefined,
  });

  // Refresh the token if it's expired and we have a refresh token
  if (oauth2Client.isTokenExpiring() && account.refresh_token) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      // Persist new access token & expiry
      await prisma.account.update({
        where: { id: account.id },
        data: {
          access_token: credentials.access_token,
          expires_at: credentials.expiry_date ? Math.floor(credentials.expiry_date / 1000) : null,
        },
      });
    } catch (err) {
      console.error('Failed to refresh Google access token', err);
    }
  }

  return oauth2Client;
}

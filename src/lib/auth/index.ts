// lib/auth.ts
import { auth, currentUser } from '@clerk/nextjs/server';
import { headers as nextHeaders } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Requires a user to be authenticated. If not, redirects to sign-in.
 * @returns The authenticated user object
 */
export async function requireUser() {
  const user = await currentUser();
  if (!user) {
    redirect('/auth/sign-in');
  }
  return user;
}

/**
 * Requires authentication and returns session details.
 * If not authenticated, redirects to sign-in.
 * @returns Object with userId, orgId, sessionClaims, and getToken function
 */
export async function requireAuth() {
  const authResult = await auth();
  const { userId, orgId, sessionClaims } = authResult;

  if (!userId) {
    redirect('/auth/sign-in');
  }

  return {
    userId,
    orgId,
    sessionClaims,
    getToken: authResult.getToken
  };
}

/**
 * Gets the current user if authenticated, returns null otherwise.
 * @returns User object or null
 */
export async function getOptionalUser() {
  try {
    return await currentUser();
  } catch {
    return null;
  }
}

/**
 * Generates authorization headers for backend API requests.
 * - Always forwards the user's Cookie (for Clerk session auth)
 * - Adds Authorization: Bearer <token> if getToken() is available
 */
export async function getBackendAuthHeaders(): Promise<Record<string, string>> {
  const h = new Headers();

  // Forward session cookie so Clerk on the backend can authenticate the request
  const hdrs = await nextHeaders();
  const cookie = hdrs.get('cookie');
  if (cookie) h.set('cookie', cookie);

  // Optionally include JWT if available (works fine alongside Cookie)
  try {
    const { getToken } = await auth();
    if (getToken) {
      const token = await getToken();
      if (token) h.set('authorization', `Bearer ${token}`);
    }
  } catch {
    // ignore
  }

  return Object.fromEntries(h);
}

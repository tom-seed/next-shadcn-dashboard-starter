import { auth, currentUser } from '@clerk/nextjs/server';
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
  } catch (error) {
    return null;
  }
}

/**
 * Generates authorization headers for backend API requests.
 * Uses Clerk JWT token if available.
 * @returns Object with Authorization header or empty object
 */
export async function getBackendAuthHeaders() {
  const authResult = await auth();

  if (!authResult.getToken) {
    return {};
  }

  try {
    // Use default template or create a custom JWT template in Clerk dashboard
    const token = await authResult.getToken();

    if (!token) {
      return {};
    }

    return {
      Authorization: `Bearer ${token}`
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to get backend auth token:', error);
    return {};
  }
}

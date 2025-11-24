import { ClientRole } from '@prisma/client';
import prisma from '@/lib/db';

/**
 * Optional: if you added the User/globalRole table,
 * these helpers let INTERNAL_ADMINs bypass org membership.
 */
async function isGlobalAdmin(clerkUserId: string): Promise<boolean> {
  if (!clerkUserId) return false;
  const u = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { globalRole: true }
  });
  return u?.globalRole === 'INTERNAL_ADMIN';
}

export function isInternalRole(role: ClientRole) {
  return role === ClientRole.INTERNAL_ADMIN;
}

export function canManageOrganization(role: ClientRole) {
  return role === ClientRole.INTERNAL_ADMIN || role === ClientRole.CLIENT_ADMIN;
}

export async function getClientMembershipsForUser(userId: string) {
  if (!userId) return [];

  const memberships = await prisma.clientMembership.findMany({
    where: { clerkUserId: userId },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          url: true,
          clerkOrganizationId: true
        }
      }
    }
  });

  return memberships;
}

export type ClientMembershipWithClient = Awaited<
  ReturnType<typeof getClientMembershipsForUser>
>[number];

/**
 * Returns:
 *  - a real membership if one exists and satisfies allowedRoles (if provided)
 *  - a synthetic INTERNAL_ADMIN membership when the user is a global admin
 *  - null if no access
 */
export async function ensureClientAccess(
  userId: string,
  clientId: number,
  allowedRoles?: ClientRole[]
) {
  // NEW: Global admin bypass
  const isDev = process.env.NODE_ENV === 'development';
  if ((await isGlobalAdmin(userId)) || isDev) {
    return {
      id: -1, // synthetic
      clientId,
      clerkUserId: userId,
      role: ClientRole.INTERNAL_ADMIN,
      createdAt: new Date(),
      updatedAt: new Date(),
      client: undefined as any // callers that need client info can query it separately
    } as unknown as ClientMembershipWithClient;
  }

  const memberships = await getClientMembershipsForUser(userId);
  const membership = memberships.find((m) => m.clientId === clientId);

  if (membership) {
    if (allowedRoles && !allowedRoles.includes(membership.role)) return null;
    return membership;
  }

  // Check Agency Org Access
  // We need to import auth dynamically or pass orgId. Since this is a library function,
  // we'll fetch the client and check if its clerkOrganizationId matches the user's active org.
  // NOTE: This requires this function to be called in a context where we can get the orgId (server component/action).
  // For now, we'll assume the caller handles the org check or we fetch it here if possible.
  // Ideally, we'd pass orgId as an argument, but to avoid breaking changes, we'll try to fetch it.

  // However, `auth()` is available in server components/actions.
  const { auth } = await import('@clerk/nextjs/server');
  const { orgId } = await auth();

  if (orgId) {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { clerkOrganizationId: true, name: true, url: true }
    });

    if (client && client.clerkOrganizationId === orgId) {
      // Grant synthetic AGENCY_ADMIN access
      return {
        id: -2, // synthetic agency
        clientId,
        clerkUserId: userId,
        role: ClientRole.AGENCY_ADMIN,
        createdAt: new Date(),
        updatedAt: new Date(),
        client: {
          id: clientId,
          name: client.name,
          url: client.url,
          clerkOrganizationId: client.clerkOrganizationId
        }
      } as unknown as ClientMembershipWithClient;
    }
  }

  return null;
}

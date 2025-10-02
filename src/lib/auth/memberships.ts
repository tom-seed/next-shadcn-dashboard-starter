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
  if (await isGlobalAdmin(userId)) {
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

  if (!membership) return null;
  if (allowedRoles && !allowedRoles.includes(membership.role)) return null;

  return membership;
}

import { ClientRole } from '@prisma/client';
import prisma from '@/lib/db';

export function isInternalRole(role: ClientRole) {
  return role === ClientRole.INTERNAL_ADMIN;
}

export function canManageOrganization(role: ClientRole) {
  return role === ClientRole.INTERNAL_ADMIN || role === ClientRole.CLIENT_ADMIN;
}

export async function getClientMembershipsForUser(userId: string) {
  if (!userId) {
    return [];
  }

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

export async function ensureClientAccess(
  userId: string,
  clientId: number,
  allowedRoles?: ClientRole[]
) {
  const memberships = await getClientMembershipsForUser(userId);
  const membership = memberships.find((m) => m.clientId === clientId);

  if (!membership) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(membership.role)) {
    return null;
  }

  return membership;
}

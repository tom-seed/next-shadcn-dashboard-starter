import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { ClientRole } from '@prisma/client';

export type Client = {
  id: number;
  name: string;
  url?: string | null;
  cron?: string | null;
  clerkOrganizationId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

/**
 * Extract roles from Clerk session claims.
 * NOTE: your JWT template serializes roles as a stringified JSON array.
 * e.g. roles: '["INTERNAL_ADMIN"]'
 */

/**
 * Extract organization memberships from Clerk session claims.
 * Supports orgs at claims.orgs or metadata.orgIds/publicMetadata.orgIds/etc.
 */
function extractOrgMemberships(claims: unknown): string[] {
  if (!claims || typeof claims !== 'object') return [];

  const orgs = (claims as Record<string, unknown>).orgs;
  if (Array.isArray(orgs)) {
    return orgs.filter((orgId): orgId is string => typeof orgId === 'string');
  }

  const metadata =
    (claims as Record<string, unknown>).metadata ??
    (claims as Record<string, unknown>).publicMetadata ??
    (claims as Record<string, unknown>).privateMetadata;

  if (metadata && typeof metadata === 'object' && 'orgIds' in metadata) {
    const orgIds = (metadata as Record<string, unknown>).orgIds;
    if (Array.isArray(orgIds)) {
      return orgIds.filter(
        (orgId): orgId is string => typeof orgId === 'string'
      );
    }
  }

  return [];
}

function dedupe<T>(inputs: (T | null | undefined)[]): T[] {
  return Array.from(new Set(inputs.filter(Boolean) as T[]));
}

/** Agency/internal roles */
function hasAgencyRole(roles: ClientRole[] | undefined | null): boolean {
  if (!roles) return false;
  const agencyRoles: ClientRole[] = [
    'AGENCY_ADMIN',
    'AGENCY_ANALYST',
    'INTERNAL_ADMIN'
  ];
  return roles.some((role) => agencyRoles.includes(role));
}

/**
 * Determines if a user can access a specific client.
 * Agency roles → global access.
 * Otherwise, user must belong to the client's Clerk org.
 */
export function canAccessClient({
  client,
  userRoles,
  activeOrgId,
  memberships
}: {
  client: Client;
  userRoles: ClientRole[] | undefined | null;
  activeOrgId?: string | null;
  memberships: string[];
}) {
  if (hasAgencyRole(userRoles)) return true;

  const clientOrgId = client.clerkOrganizationId;
  if (!clientOrgId) return false;

  if (activeOrgId && activeOrgId === clientOrgId) return true;

  return memberships.includes(clientOrgId);
}

/**
 * Requires that the user has access to the specified client.
 * Redirects to /dashboard/overview if access is denied.
 */
export async function requireClientAccess(client: Client) {
  const { userId, orgId, sessionClaims } = await requireAuth();
  const roles = sessionClaims?.roles as ClientRole[] | undefined;
  const orgMemberships = dedupe([
    orgId ?? undefined,
    ...extractOrgMemberships(sessionClaims)
  ]);

  const allowed = canAccessClient({
    client,
    userRoles: roles,
    activeOrgId: orgId,
    memberships: orgMemberships
  });

  if (!allowed) {
    redirect('/dashboard/overview');
  }

  return {
    userId,
    roles,
    activeOrgId: orgId,
    memberships: orgMemberships
  };
}

/** Can manage clients (create, invite, etc.) */
export function canManageClient(
  roles: ClientRole[] | undefined | null
): boolean {
  if (!roles) return false;
  const managementRoles: ClientRole[] = [
    'AGENCY_ADMIN',
    'AGENCY_ANALYST',
    'INTERNAL_ADMIN'
  ];
  return roles.some((role) => managementRoles.includes(role));
}

/** Require agency access for API routes; throws if denied */
export async function requireApiAgencyAccess() {
  const { sessionClaims } = await requireAuth();
  const roles = sessionClaims?.roles as ClientRole[] | undefined;

  if (!canManageClient(roles)) {
    throw new Error('Unauthorized: Agency access required');
  }

  return roles || [];
}

/** Require agency access for pages; redirects if denied */
export async function requireAgencyAccess() {
  const { sessionClaims } = await requireAuth();
  const roles = sessionClaims?.roles as ClientRole[] | undefined;

  if (!canManageClient(roles)) {
    redirect('/dashboard/overview');
  }

  return roles || [];
}

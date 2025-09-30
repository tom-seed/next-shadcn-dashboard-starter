import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import type { ClientRole } from '@prisma/client';

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
 * Extracts roles from Clerk session claims.
 * Checks multiple possible locations in the claims object.
 */
function extractRoles(claims: unknown): ClientRole[] {
  if (!claims || typeof claims !== 'object') return [];

  const candidate =
    (claims as Record<string, unknown>).metadata ??
    (claims as Record<string, unknown>).publicMetadata ??
    (claims as Record<string, unknown>).privateMetadata;

  if (candidate && typeof candidate === 'object' && 'roles' in candidate) {
    const roles = (candidate as Record<string, unknown>).roles;
    if (Array.isArray(roles)) {
      return roles.filter(
        (role): role is ClientRole => typeof role === 'string'
      ) as ClientRole[];
    }
  }

  const directRoles = (claims as Record<string, unknown>).roles;
  if (Array.isArray(directRoles)) {
    return directRoles.filter(
      (role): role is ClientRole => typeof role === 'string'
    ) as ClientRole[];
  }

  return [];
}

/**
 * Extracts organization memberships from Clerk session claims.
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

/**
 * Removes duplicates from an array.
 */
function dedupe<T>(inputs: (T | null | undefined)[]): T[] {
  return Array.from(new Set(inputs.filter(Boolean) as T[]));
}

/**
 * Checks if user has an agency role (AGENCY_ADMIN or AGENCY_ANALYST).
 */
function hasAgencyRole(roles: ClientRole[]) {
  const agencyRoles: string[] = [
    'AGENCY_ADMIN',
    'AGENCY_ANALYST',
    'INTERNAL_ADMIN'
  ];
  return roles.some((role) => agencyRoles.includes(role));
}

/**
 * Determines if a user can access a specific client.
 * Agency roles can access all clients.
 * Client roles can only access their own organization's client.
 */
export function canAccessClient({
  client,
  userRoles,
  activeOrgId,
  memberships
}: {
  client: Client;
  userRoles: ClientRole[];
  activeOrgId?: string | null;
  memberships: string[];
}) {
  // Agency roles have global access
  if (hasAgencyRole(userRoles)) {
    return true;
  }

  // Build list of allowed organization IDs
  const allowedOrgIds = dedupe([
    client.clerkOrganizationId ?? undefined,
    ...(memberships ?? [])
  ]);

  // Check if user's active org matches
  if (activeOrgId && allowedOrgIds.includes(activeOrgId)) {
    return true;
  }

  // Check if user is member of client's organization
  return client.clerkOrganizationId
    ? allowedOrgIds.includes(client.clerkOrganizationId)
    : false;
}

/**
 * Requires that the user has access to the specified client.
 * Redirects to /clients if access is denied.
 */
export async function requireClientAccess(client: Client) {
  const { userId, orgId, sessionClaims } = await requireAuth();
  const roles = extractRoles(sessionClaims);
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

/**
 * Checks if user has permission to manage clients (create, invite, etc).
 * Only AGENCY_ADMIN and AGENCY_ANALYST roles can manage.
 */
export function canManageClient(roles: ClientRole[]) {
  const managementRoles: string[] = [
    'AGENCY_ADMIN',
    'AGENCY_ANALYST',
    'INTERNAL_ADMIN'
  ];
  return roles.some((role) => managementRoles.includes(role));
}

/**
 * Extracts roles from session claims.
 * Utility function for external use.
 */
export function getRolesFromClaims(sessionClaims: unknown): ClientRole[] {
  return extractRoles(sessionClaims);
}

/**
 * Requires that the user has agency access.
 * Redirects to /dashboard if access is denied.
 */
export async function requireAgencyAccess() {
  const { sessionClaims } = await requireAuth();
  const roles = extractRoles(sessionClaims);

  if (!canManageClient(roles)) {
    redirect('/dashboard/overview');
  }

  return roles;
}

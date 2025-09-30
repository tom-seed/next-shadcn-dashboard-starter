import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { Prisma } from '@prisma/client';
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

  // The JWT template adds roles directly to the claims object.
  const roles = (claims as Record<string, unknown>).roles;

  if (Array.isArray(roles)) {
    // Ensure roles are valid ClientRole enum members
    const validRoles = Object.values(Prisma.ClientScalarFieldEnum) as string[];
    return roles.filter(
      (role): role is ClientRole =>
        typeof role === 'string' && validRoles.includes(role)
    );
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
  const agencyRoles: ClientRole[] = [
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
  if (hasAgencyRole(userRoles)) return true;

  // If the client isn't tied to a Clerk org, deny by default
  const clientOrgId = client.clerkOrganizationId;
  if (!clientOrgId) return false;

  // Allow if the user's active org matches the client's org
  if (activeOrgId && activeOrgId === clientOrgId) return true;

  // Otherwise allow if *any* membership matches the client's org
  return memberships?.includes(clientOrgId) ?? false;
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
 * Agency and internal admin roles can manage clients.
 */
export function canManageClient(roles: ClientRole[]) {
  const managementRoles: ClientRole[] = [
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
/**
 * Requires that the user has agency access for API routes.
 * Throws an error if access is denied.
 */
export async function requireApiAgencyAccess() {
  const { sessionClaims } = await requireAuth();
  const roles = extractRoles(sessionClaims);

  if (!canManageClient(roles)) {
    throw new Error('Unauthorized: Agency access required');
  }

  return roles;
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

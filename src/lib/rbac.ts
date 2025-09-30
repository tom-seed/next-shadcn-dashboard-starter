// auth/access.ts
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import type { ClientRole } from '@prisma/client';

// Safely parse roles from Clerk session claims.
// Handles:
// - ["INTERNAL_ADMIN"]
// - { roles: ["INTERNAL_ADMIN"] }
// - JSON strings of either of the above
// - CSV fallback: "INTERNAL_ADMIN,AGENCY_ADMIN"
export function parseRoles(rawRoles: unknown): ClientRole[] {
  // Already an array
  if (Array.isArray(rawRoles)) {
    return rawRoles as ClientRole[];
  }

  // Object wrapper: { roles: [...] }
  if (rawRoles && typeof rawRoles === 'object') {
    const maybe = (rawRoles as Record<string, unknown>).roles;
    if (Array.isArray(maybe)) {
      return maybe as ClientRole[];
    }
  }

  // String variants
  if (typeof rawRoles === 'string') {
    // Try JSON first
    try {
      const parsed = JSON.parse(rawRoles);
      if (Array.isArray(parsed)) return parsed as ClientRole[];
      if (
        parsed &&
        typeof parsed === 'object' &&
        Array.isArray((parsed as any).roles)
      ) {
        return (parsed as any).roles as ClientRole[];
      }
    } catch {
      // not JSON, fall through
    }

    // CSV fallback: "INTERNAL_ADMIN,AGENCY_ADMIN"
    const csv = rawRoles
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (csv.length) return csv as ClientRole[];
  }

  return [];
}

export type Client = {
  id: number;
  name: string;
  url?: string | null;
  cron?: string | null;
  clerkOrganizationId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

function extractOrgMemberships(claims: unknown): string[] {
  if (!claims || typeof claims !== 'object') return [];

  const orgs = (claims as Record<string, unknown>).orgs;
  if (Array.isArray(orgs)) {
    return orgs.filter((id): id is string => typeof id === 'string');
  }

  const c = claims as Record<string, any>;
  const metadata = c.metadata ?? c.publicMetadata ?? c.privateMetadata;

  if (metadata && typeof metadata === 'object' && 'orgIds' in metadata) {
    const orgIds = (metadata as any).orgIds;
    if (Array.isArray(orgIds)) {
      return orgIds.filter((id): id is string => typeof id === 'string');
    }
  }

  return [];
}

function dedupe<T>(inputs: (T | null | undefined)[]): T[] {
  return Array.from(new Set(inputs.filter(Boolean) as T[]));
}

function hasAgencyRole(roles: ClientRole[] | undefined | null): boolean {
  if (!Array.isArray(roles)) return false;
  const agencyRoles: ClientRole[] = [
    'AGENCY_ADMIN',
    'AGENCY_ANALYST',
    'INTERNAL_ADMIN'
  ];
  return roles.some((role) => agencyRoles.includes(role));
}

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
}): boolean {
  if (hasAgencyRole(userRoles)) return true;

  const clientOrgId = client.clerkOrganizationId;
  if (!clientOrgId) return false;

  if (activeOrgId && activeOrgId === clientOrgId) return true;

  return memberships.includes(clientOrgId);
}

export async function requireClientAccess(client: Client) {
  const { userId, orgId, sessionClaims } = await requireAuth();
  const roles = parseRoles((sessionClaims as any)?.roles);
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

export function canManageClient(
  roles: ClientRole[] | undefined | null
): boolean {
  if (!Array.isArray(roles)) return false;
  const managementRoles: ClientRole[] = [
    'AGENCY_ADMIN',
    'AGENCY_ANALYST',
    'INTERNAL_ADMIN'
  ];
  return roles.some((role) => managementRoles.includes(role));
}

export async function requireApiAgencyAccess() {
  const { sessionClaims } = await requireAuth();
  const roles = parseRoles((sessionClaims as any)?.roles);

  if (!canManageClient(roles)) {
    throw new Error('Unauthorized: Agency access required');
  }

  return roles;
}

export async function requireAgencyAccess() {
  const { sessionClaims } = await requireAuth();
  const roles = parseRoles((sessionClaims as any)?.roles);

  if (!canManageClient(roles)) {
    redirect('/dashboard/overview');
  }

  return roles;
}

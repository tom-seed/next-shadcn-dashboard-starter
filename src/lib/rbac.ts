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

// --- Role helpers ---------------------------------------------------------

export function parseRoles(rawRoles: unknown): ClientRole[] {
  if (Array.isArray(rawRoles)) {
    return rawRoles as ClientRole[];
  }

  if (rawRoles && typeof rawRoles === 'object') {
    const maybe = (rawRoles as Record<string, unknown>).roles;
    if (Array.isArray(maybe)) {
      return maybe as ClientRole[];
    }
  }

  if (typeof rawRoles === 'string') {
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
      // not JSON; fall through to CSV parsing
    }

    const csv = rawRoles
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (csv.length) return csv as ClientRole[];
  }

  return [];
}

function extractRoles(claims: unknown): ClientRole[] {
  if (!claims || typeof claims !== 'object') return [];

  const direct = parseRoles((claims as Record<string, unknown>).roles);
  if (direct.length) return direct;

  const metadata =
    (claims as Record<string, unknown>).metadata ??
    (claims as Record<string, unknown>).publicMetadata ??
    (claims as Record<string, unknown>).privateMetadata;

  const fromMetadata = parseRoles(metadata);
  if (fromMetadata.length) return fromMetadata;

  return [];
}

function extractOrgMemberships(claims: unknown): string[] {
  if (!claims || typeof claims !== 'object') return [];

  const orgs = (claims as Record<string, unknown>).orgs;
  if (Array.isArray(orgs)) {
    return orgs.filter((id): id is string => typeof id === 'string');
  }

  const metadata =
    (claims as Record<string, unknown>).metadata ??
    (claims as Record<string, unknown>).publicMetadata ??
    (claims as Record<string, unknown>).privateMetadata;

  if (metadata && typeof metadata === 'object' && 'orgIds' in metadata) {
    const orgIds = (metadata as Record<string, unknown>).orgIds;
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

// --- Access checks --------------------------------------------------------

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
  const roles = extractRoles(sessionClaims);

  if (!canManageClient(roles)) {
    throw new Error('Unauthorized: Agency access required');
  }

  return roles;
}

export async function requireAgencyAccess() {
  const { userId, sessionClaims } = await requireAuth();
  const roles = extractRoles(sessionClaims);

  if (canManageClient(roles)) {
    return roles;
  }

  const { isGlobalAdmin } = await import('@/lib/auth/global-role');
  const isAdmin = await isGlobalAdmin(userId);

  if (!isAdmin) {
    redirect('/dashboard/overview');
  }

  return ['INTERNAL_ADMIN'] as ClientRole[];
}

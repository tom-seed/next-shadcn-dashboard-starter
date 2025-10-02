import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { ClientRole } from '@prisma/client';

import prisma from '@/lib/db';
import {
  ensureClientAccess,
  canManageOrganization
} from '@/lib/auth/memberships';

interface InvitationPayload {
  email: string;
  role?: ClientRole;
}

const allowedInviteRoles = new Set<ClientRole>([
  ClientRole.INTERNAL_ADMIN,
  ClientRole.CLIENT_ADMIN,
  ClientRole.CLIENT_MEMBER
]);

const mapClientRoleToOrganizationRole = (role: ClientRole) =>
  role === ClientRole.CLIENT_ADMIN || role === ClientRole.INTERNAL_ADMIN
    ? 'admin'
    : 'basic_member';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { clientId } = await params;
  const id = Number(clientId);

  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
  }

  const payload = (await req
    .json()
    .catch(() => null)) as InvitationPayload | null;

  if (!payload?.email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const targetRole = payload.role ?? ClientRole.CLIENT_MEMBER;

  if (!allowedInviteRoles.has(targetRole)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const membership = await ensureClientAccess(userId, id, [
    ClientRole.INTERNAL_ADMIN,
    ClientRole.CLIENT_ADMIN
  ]);

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!canManageOrganization(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const client = await prisma.client.findUnique({
    where: { id },
    select: { clerkOrganizationId: true, name: true }
  });

  if (!client?.clerkOrganizationId) {
    return NextResponse.json(
      { error: 'Client organization is not configured' },
      { status: 400 }
    );
  }

  try {
    const clerk = await clerkClient();

    const invitation = await clerk.organizations.createOrganizationInvitation({
      organizationId: client.clerkOrganizationId,
      emailAddress: payload.email,
      inviterUserId: userId,
      role: mapClientRoleToOrganizationRole(targetRole),
      publicMetadata: {
        clientRole: targetRole,
        clientId: id
      }
    });

    return NextResponse.json({ invitation });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to create organization invitation', error);
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}

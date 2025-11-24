import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { ClientRole } from '@prisma/client';

import prisma from '@/lib/db';
import {
  getClientMembershipsForUser,
  isInternalRole
} from '@/lib/auth/memberships';

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 40);

const ensureUniqueSlug = (baseSlug: string) =>
  `${baseSlug || 'client'}-${Date.now().toString(36).slice(-6)}`;

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
      const allClients = await prisma.client.findMany({
        orderBy: { name: 'asc' }
      });
      const clients = allClients.map((client) => ({
        id: client.id,
        name: client.name,
        role: ClientRole.INTERNAL_ADMIN,
        clerkOrganizationId: client.clerkOrganizationId
      }));
      return NextResponse.json(clients);
    }

    const { orgId } = await auth();
    const memberships = await getClientMembershipsForUser(userId);

    // Fetch clients where the user is a member OR the client belongs to the user's active Agency Org
    const agencyClients = orgId
      ? await prisma.client.findMany({
          where: { clerkOrganizationId: orgId },
          select: {
            id: true,
            name: true,
            url: true,
            clerkOrganizationId: true
          }
        })
      : [];

    // Combine and deduplicate
    const clientMap = new Map();

    memberships.forEach((m) => {
      clientMap.set(m.client.id, {
        id: m.client.id,
        name: m.client.name,
        role: m.role,
        clerkOrganizationId: m.client.clerkOrganizationId
      });
    });

    agencyClients.forEach((c) => {
      if (!clientMap.has(c.id)) {
        clientMap.set(c.id, {
          id: c.id,
          name: c.name,
          role: ClientRole.AGENCY_ADMIN, // Default role for agency visibility
          clerkOrganizationId: c.clerkOrganizationId
        });
      }
    });

    const clients = Array.from(clientMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return NextResponse.json(clients);
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to load clients' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { name?: string; url?: string | null; cron?: string | null };

  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const name = body.name?.trim();
  const url = body.url?.trim() || null;
  const cron = body.cron?.trim() || null;

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  try {
    const memberships = await getClientMembershipsForUser(userId);
    const hasInternalAccess = memberships.some((membership) =>
      isInternalRole(membership.role)
    );

    if (!hasInternalAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const baseSlug = slugify(name);
    const slug = ensureUniqueSlug(baseSlug);

    // DEPRECATED: We no longer create Clerk Organizations for each client.
    // The client is now just a record in our DB, and we manage access via ClientMembership.

    // NEW: If the user is in an Agency Org context, link the client to that Org.
    const { orgId } = await auth();

    const client = await prisma.client.create({
      data: {
        name,
        url,
        cron,
        clerkOrganizationId: orgId || null, // Link to Agency Org if present
        memberships: {
          create: {
            clerkUserId: userId,
            role: ClientRole.INTERNAL_ADMIN
          }
        }
      },
      select: {
        id: true,
        name: true,
        url: true,
        cron: true,
        clerkOrganizationId: true
      }
    });

    return NextResponse.json({ client });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Failed to create client', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}

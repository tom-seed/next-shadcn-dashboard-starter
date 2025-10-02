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
    const memberships = await getClientMembershipsForUser(userId);

    const clients = memberships
      .map((membership) => ({
        id: membership.client.id,
        name: membership.client.name,
        role: membership.role,
        clerkOrganizationId: membership.client.clerkOrganizationId
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

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

    const clerk = await clerkClient();

    const organization = await clerk.organizations.createOrganization({
      name,
      slug,
      createdBy: userId
    });

    // Ensure the creating user is an admin of the new organization.
    try {
      await clerk.organizations.createOrganizationMembership({
        organizationId: organization.id,
        userId,
        role: 'admin'
      });
    } catch (membershipError) {
      // Ignore if membership already exists (Clerk auto-assigns admin on create).
    }

    const client = await prisma.client.create({
      data: {
        name,
        url,
        cron,
        clerkOrganizationId: organization.id,
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

    return NextResponse.json({ client, organization });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Failed to create client', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}

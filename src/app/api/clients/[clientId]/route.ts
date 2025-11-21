// FILE: src/app/api/clients/[clientId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import { ensureClientAccess } from '@/lib/auth/memberships';

const prisma = new PrismaClient().$extends(withAccelerate());

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { clientId } = await params;
  const id = parseInt(clientId);

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
  }

  const membership = await ensureClientAccess(userId, id);

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const client = await prisma.client.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      url: true // ✅ This line is critical
    },
    cacheStrategy: { ttl: 3600 * 24, swr: 3600 * 24 * 3 }
  });

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  return NextResponse.json(client);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { clientId } = await params;
  const id = parseInt(clientId);

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
  }

  // Check if user has permission to update (INTERNAL_ADMIN or CLIENT_ADMIN only)
  const membership = await ensureClientAccess(userId, id, [
    'INTERNAL_ADMIN',
    'CLIENT_ADMIN'
  ]);

  if (!membership) {
    return NextResponse.json(
      { error: 'Forbidden: Only admins can update clients' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { name, url, cron } = body;

    // Validate that at least one field is provided
    if (!name && !url && cron === undefined) {
      return NextResponse.json(
        { error: 'At least one field (name, url, or cron) must be provided' },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updateData: {
      name?: string;
      url?: string;
      cron?: string | null;
    } = {};

    if (name !== undefined) updateData.name = name;
    if (url !== undefined) updateData.url = url;
    if (cron !== undefined) updateData.cron = cron;

    const updatedClient = await prisma.client.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        url: true,
        cron: true
      }
    });

    return NextResponse.json(updatedClient);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to update client:', error);
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { clientId } = await params;
  const id = parseInt(clientId);

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
  }

  // Check if user has permission to delete (INTERNAL_ADMIN or CLIENT_ADMIN only)
  const membership = await ensureClientAccess(userId, id, [
    'INTERNAL_ADMIN',
    'CLIENT_ADMIN'
  ]);

  if (!membership) {
    return NextResponse.json(
      { error: 'Forbidden: Only admins can delete clients' },
      { status: 403 }
    );
  }

  try {
    const clerk = await clerkClient();

    // Look up related Clerk organization so we can clean it up as well
    const client = await prisma.client.findUnique({
      where: { id },
      select: { clerkOrganizationId: true }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    if (client.clerkOrganizationId) {
      try {
        await clerk.organizations.deleteOrganization(
          client.clerkOrganizationId
        );
      } catch (clerkError) {
        // eslint-disable-next-line no-console
        console.error('Failed to delete Clerk organization:', clerkError);
      }
    }

    // Delete the client - Prisma will handle cascade deletes based on schema
    await prisma.client.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Client deleted' });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to delete client:', error);
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    );
  }
}

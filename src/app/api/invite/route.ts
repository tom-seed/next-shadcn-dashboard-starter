import { NextResponse } from 'next/server';
import { z } from 'zod';
import { clerkClient } from '@clerk/nextjs/server';
import { requireAgencyAccess } from '@/lib/rbac';
import prisma from '@/lib/db';

const schema = z.object({
  clientId: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === 'string' ? parseInt(val, 10) : val)),
  email: z.string().email('Enter a valid email'),
  role: z.enum(['CLIENT_ADMIN', 'CLIENT_VIEWER'])
});

export async function POST(request: Request) {
  try {
    // Verify user has agency access
    await requireAgencyAccess();

    // Parse and validate request body
    const body = await request.json();
    const payload = schema.safeParse(body);

    if (!payload.success) {
      return NextResponse.json(
        { error: payload.error.flatten() },
        { status: 400 }
      );
    }

    const { clientId, email, role } = payload.data;

    // Get client from database
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });

    if (!client || !client.clerkOrganizationId) {
      return NextResponse.json(
        { error: 'Client organization not available' },
        { status: 400 }
      );
    }

    // Create Clerk organization invitation
    const clerk = await clerkClient();

    try {
      await clerk.organizations.createOrganizationInvitation({
        organizationId: client.clerkOrganizationId,
        emailAddress: email,
        role: role === 'CLIENT_ADMIN' ? 'org:admin' : 'org:member'
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to create Clerk invite:', error);
      return NextResponse.json(
        { error: 'Failed to send invitation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to invite user:', error);
    return NextResponse.json(
      { error: 'Failed to invite user' },
      { status: 500 }
    );
  }
}

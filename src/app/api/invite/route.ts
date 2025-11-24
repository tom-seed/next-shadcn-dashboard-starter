import { NextResponse } from 'next/server';
import { z } from 'zod';
import { clerkClient, auth } from '@clerk/nextjs/server';
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

    // 1. Check if User Exists in our DB
    // We need to look up the user by email. Since we don't store email in our User table (only clerkUserId),
    // we have to query Clerk first to get the userId for this email.
    const clerk = await clerkClient();
    let existingUserId: string | null = null;

    try {
      const userList = await clerk.users.getUserList({ emailAddress: [email] });
      if (userList.data.length > 0) {
        existingUserId = userList.data[0].id;
      }
    } catch (e) {
      console.error('Failed to lookup user in Clerk', e);
    }

    if (existingUserId) {
      // 2a. Grant Immediate Access
      await prisma.clientMembership.upsert({
        where: {
          clientId_clerkUserId: {
            clientId,
            clerkUserId: existingUserId
          }
        },
        update: {
          role: role
        },
        create: {
          clientId,
          clerkUserId: existingUserId,
          role: role
        }
      });

      return NextResponse.json({ ok: true, message: 'User added immediately' });
    }

    // 2b. Invite New User via Clerk (Application Invitation)
    // This sends the email for us.
    try {
      const invitation = await clerk.invitations.createInvitation({
        emailAddress: email,
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        publicMetadata: {
          invitedToClientId: clientId,
          invitedRole: role
        }
      });

      // 3. Store Invitation Record
      // We store this so we can link them when they sign up (via webhook)
      await prisma.clientInvite.create({
        data: {
          email,
          clientId,
          role,
          token: invitation.id,
          inviterId: (await auth()).userId!,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to create Clerk invite:', error);
      return NextResponse.json(
        { error: 'Failed to send invitation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, message: 'Invitation sent' });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to invite user:', error);
    return NextResponse.json(
      { error: 'Failed to invite user' },
      { status: 500 }
    );
  }
}

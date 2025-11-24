import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      'Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local'
    );
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    });
  }

  // Handle the event
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses } = evt.data;

    if (!id || !email_addresses) {
      return new Response('Error occured -- missing data', {
        status: 400
      });
    }

    const emails = email_addresses.map((e) => e.email_address);

    // Check for pending invites for any of the user's emails
    const pendingInvites = await prisma.clientInvite.findMany({
      where: {
        email: {
          in: emails
        }
      }
    });

    if (pendingInvites.length > 0) {
      // Create memberships for all found invites
      await prisma.$transaction(
        pendingInvites.map((invite) =>
          prisma.clientMembership.create({
            data: {
              clientId: invite.clientId,
              clerkUserId: id,
              role: invite.role
            }
          })
        )
      );

      // Delete the used invites
      await prisma.clientInvite.deleteMany({
        where: {
          id: {
            in: pendingInvites.map((i) => i.id)
          }
        }
      });

      console.log(`Linked ${pendingInvites.length} invites for user ${id}`);
    }
  }

  return new Response('', { status: 200 });
}

import { NextRequest, NextResponse } from 'next/server';
import { ClientRole } from '@prisma/client';

import prisma from '@/lib/db';
import {
  ClerkWebhookError,
  verifyClerkWebhook
} from '@/lib/auth/verify-clerk-webhook';

interface ClerkWebhookEvent<T = any> {
  type: string;
  data: T;
}

interface ClerkMetadata {
  clientId?: number | string;
  clientRole?: string;
}

function parseClientRole(value: unknown): ClientRole {
  if (typeof value !== 'string') return ClientRole.CLIENT_MEMBER;

  if ((Object.values(ClientRole) as string[]).includes(value)) {
    return value as ClientRole;
  }

  return ClientRole.CLIENT_MEMBER;
}

function parseClientId(meta: ClerkMetadata, fallback?: number | null) {
  if (typeof meta.clientId === 'number') return meta.clientId;
  if (typeof meta.clientId === 'string' && meta.clientId.trim().length > 0) {
    const parsed = Number(meta.clientId);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback ?? null;
}

async function upsertMembership(params: {
  clerkUserId: string;
  organizationId: string;
  metadata: ClerkMetadata;
}) {
  const { clerkUserId, organizationId, metadata } = params;

  const client = await prisma.client.findFirst({
    where: {
      clerkOrganizationId: organizationId
    },
    select: {
      id: true
    }
  });

  if (!client) {
    return;
  }

  const role = parseClientRole(metadata.clientRole);
  const clientIdFromMetadata = parseClientId(metadata, client.id);

  if (clientIdFromMetadata !== client.id) {
    // Avoid cross-tenant pollution when metadata is stale or incorrect
    return;
  }

  await prisma.clientMembership.upsert({
    where: {
      clientId_clerkUserId: {
        clientId: client.id,
        clerkUserId
      }
    },
    update: {
      role
    },
    create: {
      clientId: client.id,
      clerkUserId,
      role
    }
  });
}

async function deleteMembership(params: {
  clerkUserId: string;
  organizationId: string;
}) {
  const { clerkUserId, organizationId } = params;

  const client = await prisma.client.findFirst({
    where: { clerkOrganizationId: organizationId },
    select: { id: true }
  });

  if (!client) {
    return;
  }

  await prisma.clientMembership.deleteMany({
    where: {
      clientId: client.id,
      clerkUserId
    }
  });
}

export async function POST(req: NextRequest) {
  const payload = await req.text();

  try {
    verifyClerkWebhook(req.headers, payload);
  } catch (error) {
    const message =
      error instanceof ClerkWebhookError
        ? error.message
        : 'Unable to verify webhook';

    return NextResponse.json({ error: message }, { status: 400 });
  }

  let event: ClerkWebhookEvent;

  try {
    event = JSON.parse(payload) as ClerkWebhookEvent;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON payload' },
      { status: 400 }
    );
  }

  const { type } = event;

  switch (type) {
    case 'organization.created': {
      // Organization created - ensure client record exists
      const orgData = event.data as any;
      const organizationId = orgData.id;
      const name = orgData.name || 'Unnamed Client';

      if (!organizationId) break;

      // Check if client already exists
      const existingClient = await prisma.client.findFirst({
        where: { clerkOrganizationId: organizationId }
      });

      if (!existingClient) {
        // Create client record if it doesn't exist
        await prisma.client.create({
          data: {
            name,
            clerkOrganizationId: organizationId
          }
        });
      }

      break;
    }

    case 'organization.deleted': {
      // Organization deleted - optionally handle cleanup
      const orgData = event.data as any;
      const organizationId = orgData.id;

      if (!organizationId) break;

      // Soft delete or mark as inactive instead of hard delete
      // This preserves historical data
      await prisma.client.updateMany({
        where: { clerkOrganizationId: organizationId },
        data: { clerkOrganizationId: null }
      });

      break;
    }

    case 'organization.memberships.created':
    case 'organization.memberships.updated': {
      const data = event.data as {
        organization_id?: string;
        public_metadata?: ClerkMetadata;
        user_id?: string;
      };

      if (!data.organization_id || !data.user_id) {
        break;
      }

      await upsertMembership({
        clerkUserId: data.user_id,
        organizationId: data.organization_id,
        metadata: data.public_metadata ?? {}
      });

      break;
    }

    case 'organization.memberships.deleted': {
      const data = event.data as {
        organization_id?: string;
        user_id?: string;
      };

      if (!data.organization_id || !data.user_id) {
        break;
      }

      await deleteMembership({
        clerkUserId: data.user_id,
        organizationId: data.organization_id
      });

      break;
    }

    case 'organization.invitations.accepted': {
      const data = event.data as {
        organization_id?: string;
        public_metadata?: ClerkMetadata;
        user_id?: string;
      };

      if (!data.organization_id || !data.user_id) {
        break;
      }

      await upsertMembership({
        clerkUserId: data.user_id,
        organizationId: data.organization_id,
        metadata: data.public_metadata ?? {}
      });

      break;
    }

    default:
      // Ignore unrelated events
      break;
  }

  return NextResponse.json({ received: true });
}

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClerkClient } from '@clerk/backend';
import { PrismaClient, ClientRole } from '@prisma/client';

function loadEnvFromFile() {
  const candidate = process.env.ENV_FILE || '.env';
  const envPath = resolve(process.cwd(), candidate);
  try {
    const raw = readFileSync(envPath, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const equalsIndex = trimmed.indexOf('=');
      if (equalsIndex === -1) continue;
      const key = trimmed.slice(0, equalsIndex).trim();
      const valueRaw = trimmed.slice(equalsIndex + 1).trim();
      if (!key || process.env[key]) continue;
      const value = valueRaw
        .replace(/^['"]/, '')
        .replace(/['"]$/, '');
      process.env[key] = value;
    }
  } catch (error) {
    // Optional: ignore missing .env file. Environment variables might already be set.
  }
}

loadEnvFromFile();

const prisma = new PrismaClient();

if (!process.env.CLERK_SECRET_KEY) {
  throw new Error('CLERK_SECRET_KEY must be set in the environment to call Clerk APIs.');
}

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});

const PAGE_SIZE = 100;

function mapRoleFromMetadata(metadata) {
  const maybeRole = metadata?.clientRole;
  if (typeof maybeRole === 'string') {
    if ((Object.values(ClientRole) ).includes(maybeRole)) {
      return /** @type {ClientRole} */ (maybeRole);
    }
    const normalized = maybeRole.toUpperCase();
    if (normalized in ClientRole) {
      return ClientRole[normalized];
    }
  }
  return null;
}

function mapRoleFromClerkRole(role) {
  if (role === 'admin') {
    return ClientRole.CLIENT_ADMIN;
  }
  return ClientRole.CLIENT_MEMBER;
}

async function listAllOrganizationMembers(organizationId) {
  const members = [];
  let offset = 0;
  while (true) {
    const page = await clerkClient.organizations.getOrganizationMembershipList({
      organizationId,
      limit: PAGE_SIZE,
      offset
    });

    members.push(...page.data);

    if (!page.data.length) {
      break;
    }

    offset += page.data.length;
    if (offset >= (page.totalCount ?? Number.POSITIVE_INFINITY)) {
      break;
    }
  }
  return members;
}

function extractUserId(member) {
  return (
    member.userId ??
    member.user_id ??
    member.user?.id ??
    member.publicUserData?.userId ??
    member.publicUserData?.user_id ??
    member.public_user_data?.userId ??
    member.public_user_data?.user_id ??
    null
  );
}

async function syncMembership({ client, member }) {
  const userId = extractUserId(member);

  if (!userId) {
    console.warn(
      `  Skipping membership with no userId for client ${client.id} (Clerk membership id ${member.id}).`
    );
    return 'skippedNoUser';
  }

  const metadataRole = mapRoleFromMetadata(member.publicMetadata);
  const targetRole = metadataRole ?? mapRoleFromClerkRole(member.role);

  const existing = await prisma.clientMembership.findUnique({
    where: {
      clientId_clerkUserId: {
        clientId: client.id,
        clerkUserId: userId
      }
    }
  });

  if (!existing) {
    await prisma.clientMembership.create({
      data: {
        clientId: client.id,
        clerkUserId: userId,
        role: targetRole
      }
    });
    return 'created';
  }

  if (existing.role !== targetRole) {
    await prisma.clientMembership.update({
      where: { id: existing.id },
      data: { role: targetRole }
    });
    return 'updated';
  }

  return 'unchanged';
}

async function main() {
  const clients = await prisma.client.findMany({
    select: {
      id: true,
      name: true,
      clerkOrganizationId: true
    }
  });

  const summary = {
    clients: clients.length,
    processedClients: 0,
    skippedNoOrg: 0,
    skippedNoUser: 0,
    created: 0,
    updated: 0,
    unchanged: 0
  };

  for (const client of clients) {
    if (!client.clerkOrganizationId) {
      summary.skippedNoOrg += 1;
      console.warn(`Skipping client ${client.name} (id=${client.id}) – no clerkOrganizationId set.`);
      continue;
    }

    console.log(`Syncing members for client ${client.name} (${client.id})`);
    const members = await listAllOrganizationMembers(client.clerkOrganizationId);
    console.log(`  Found ${members.length} Clerk memberships.`);

    for (const member of members) {
      const result = await syncMembership({ client, member });
      if (result in summary) {
        summary[result] += 1;
      }
    }

    summary.processedClients += 1;
  }

  console.log('\nBackfill complete:');
  console.table(summary);
}

main()
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

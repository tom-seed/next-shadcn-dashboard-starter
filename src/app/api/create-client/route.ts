/* eslint-disable no-console */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth, clerkClient } from '@clerk/nextjs/server';
import prisma from '@/lib/db';

const schema = z.object({
  name: z.string().min(2, 'Client name is required'),
  url: z.string().url('Enter a valid URL'),
  startCrawl: z.boolean().optional().default(true),
  cron: z.string().optional()
});

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 40);

const ensureUniqueSlug = (baseSlug: string) =>
  `${baseSlug || 'client'}-${Date.now().toString(36).slice(-6)}`;

function getBackendConfig() {
  const backendUrl =
    process.env.NEXT_PUBLIC_NODE_API || process.env.NEXT_PUBLIC_BACKEND_URL;
  const apiKey = process.env.SPIDER_API_KEY;
  return { backendUrl, apiKey };
}

export async function POST(request: Request) {
  try {
    // must be signed in (we also need userId to create a membership below)
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { name, url, startCrawl, cron } = parsed.data;

    // 1) Create a Clerk organization (best effort)
    const baseSlug = slugify(name);
    const slug = ensureUniqueSlug(baseSlug);

    let organizationId: string;
    try {
      const clerk = await clerkClient(); // your project exposes clerkClient as a function
      const organization = await clerk.organizations.createOrganization({
        name,
        slug
      });
      organizationId = organization.id;
    } catch (err) {
      console.warn('Failed to create Clerk organization, using mock ID:', err);
      organizationId = `org_mock_${Date.now()}`;
    }

    // 2) Upsert the Client row (unique by clerkOrganizationId)
    const client = await prisma.client.upsert({
      where: { clerkOrganizationId: organizationId },
      update: {
        name,
        ...(url ? { url } : {}),
        ...(cron ? { cron } : {})
      },
      create: {
        name,
        url,
        cron: cron || null,
        clerkOrganizationId: organizationId
      },
      select: { id: true }
    });

    const clientId = client.id;

    // 2b) Ensure the creator can manage/see it – add membership as CLIENT_ADMIN
    await prisma.clientMembership.upsert({
      where: { clientId_clerkUserId: { clientId, clerkUserId: userId } },
      update: {}, // keep existing role if present
      create: { clientId, clerkUserId: userId, role: 'CLIENT_ADMIN' }
    });

    // 3) Kick off the crawl via the backend (API key auth; no cookies needed)
    if (startCrawl) {
      const { backendUrl, apiKey } = getBackendConfig();
      if (!backendUrl || !apiKey) {
        console.warn('Backend config missing; skipping crawl kick-off.');
      } else {
        try {
          const resp = await fetch(`${backendUrl}/start-crawl`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({ clientId, url })
          });
          if (!resp.ok) {
            console.warn('Backend /start-crawl failed:', await resp.text());
          }
        } catch (err) {
          console.warn('Backend /start-crawl unreachable:', err);
        }
      }
    }

    return NextResponse.json(
      { clientId, redirectUrl: `/dashboard/${clientId}/overview` },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create client:', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}

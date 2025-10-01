/* eslint-disable no-console */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { clerkClient } from '@clerk/nextjs/server';
import { requireApiAgencyAccess } from '@/lib/rbac';
import { getBackendAuthHeaders } from '@/lib/auth';
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

export async function POST(request: Request) {
  try {
    // Require agency access (front-door auth)
    await requireApiAgencyAccess();

    // Validate input
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { name, url, startCrawl, cron } = parsed.data;

    // Create a Clerk organization (best-effort)
    const baseSlug = slugify(name);
    const slug = ensureUniqueSlug(baseSlug);

    let organizationId: string;
    try {
      // NOTE: In your setup, clerkClient is a function that returns the client
      const clerk = await clerkClient();
      const organization = await clerk.organizations.createOrganization({
        name,
        slug
      });
      organizationId = organization.id;
    } catch (err) {
      console.warn('Failed to create Clerk organization, using mock ID:', err);
      organizationId = `org_mock_${Date.now()}`;
    }

    const backendUrl =
      process.env.NEXT_PUBLIC_NODE_API || process.env.NEXT_PUBLIC_BACKEND_URL;

    let clientId: number | null = null;

    // Prefer creating via the Node backend (global source of truth)
    if (backendUrl) {
      try {
        const headers = await getBackendAuthHeaders();
        const resp = await fetch(`${backendUrl}/clients`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...headers
          } as HeadersInit,
          credentials: 'include', // IMPORTANT for Clerk session cookie
          body: JSON.stringify({
            name,
            url,
            cron,
            clerkOrganizationId: organizationId
          })
        });

        if (resp.ok) {
          const json = await resp.json();
          if (typeof json.id !== 'number') {
            throw new Error('Backend did not return a numeric client id');
          }
          clientId = json.id;

          // Optionally trigger first crawl
          if (startCrawl) {
            try {
              const crawlHeaders = await getBackendAuthHeaders();
              await fetch(`${backendUrl}/start-crawl`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...crawlHeaders
                } as HeadersInit,
                credentials: 'include',
                body: JSON.stringify({ clientId, url })
              });
            } catch (crawlErr) {
              console.warn('Failed to trigger start crawl:', crawlErr);
            }
          }
        } else {
          console.warn('Backend create-client failed:', await resp.text());
          // If you prefer fail-fast instead of local fallback, return here with the backend status.
          // return NextResponse.json({ error: 'Backend error' }, { status: resp.status || 502 });
        }
      } catch (fetchErr) {
        console.warn('Backend create-client unreachable:', fetchErr);
      }
    }

    // Local fallback (only if backend didn’t yield an id)
    if (clientId == null) {
      const client = await prisma.client.create({
        data: {
          name,
          url,
          cron,
          clerkOrganizationId: organizationId
        }
      });
      clientId = client.id;
      // If you have a local crawler, you could kick it off here.
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

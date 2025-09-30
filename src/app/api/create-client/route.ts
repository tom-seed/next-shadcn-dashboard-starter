import { NextResponse } from 'next/server';
import { z } from 'zod';
import { clerkClient } from '@clerk/nextjs/server';
import { requireAgencyAccess } from '@/lib/rbac';
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
    // Verify user has agency access
    const roles = await requireAgencyAccess();
    if (!roles.length) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const payload = schema.safeParse(body);

    if (!payload.success) {
      return NextResponse.json(
        { error: payload.error.flatten() },
        { status: 400 }
      );
    }

    const { name, url, startCrawl, cron } = payload.data;

    // Generate unique slug for Clerk organization
    const baseSlug = slugify(name);
    const slug = ensureUniqueSlug(baseSlug);

    // Create Clerk organization
    let organizationId = `org_mock_${Date.now()}`;
    const clerk = await clerkClient();

    try {
      const organization = await clerk.organizations.createOrganization({
        name,
        slug
      });
      organizationId = organization.id;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(
        'Failed to create Clerk organization, using mock ID:',
        error
      );
    }

    // Create client record in database
    const backendUrl =
      process.env.ATLAS_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
    let clientId = Date.now();

    if (backendUrl) {
      try {
        const headers = await getBackendAuthHeaders();
        const response = await fetch(`${backendUrl}/clients`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...headers
          } as HeadersInit,
          body: JSON.stringify({
            name,
            url,
            cron,
            clerkOrganizationId: organizationId
          })
        });

        if (response.ok) {
          const json = await response.json();
          clientId = json.id ?? clientId;
        } else {
          // eslint-disable-next-line no-console
          console.warn('Backend create-client failed:', await response.text());
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Backend create-client unreachable:', error);
      }

      // Trigger initial crawl if requested
      if (startCrawl) {
        try {
          const headers = await getBackendAuthHeaders();
          await fetch(`${backendUrl}/start-crawl`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...headers
            } as HeadersInit,
            body: JSON.stringify({ clientId, url })
          });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn('Failed to trigger start crawl:', error);
        }
      }
    } else {
      // Fallback: Create client in local database if no backend
      const client = await prisma.client.create({
        data: {
          name,
          url,
          cron,
          clerkOrganizationId: organizationId
        }
      });
      clientId = client.id;
    }

    return NextResponse.json(
      {
        clientId,
        redirectUrl: `/dashboard/${clientId}/overview`
      },
      { status: 201 }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to create client:', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}

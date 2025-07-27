// src/app/api/client/[clientId]/urls/[urlId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient().$extends(withAccelerate());

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string; urlId: string }> }
) {
  const { clientId, urlId } = await params;

  const clientIdInt = parseInt(clientId);
  const urlIdInt = parseInt(urlId);

  if (isNaN(clientIdInt) || isNaN(urlIdInt)) {
    return NextResponse.json(
      { error: 'Invalid clientId or urlId' },
      { status: 400 }
    );
  }

  try {
    const url = await prisma.urls.findUnique({
      where: { id: urlIdInt, clientId: clientIdInt },
      select: {
        id: true,
        url: true,
        status: true,
        metaTitle: true,
        metaDescription: true,
        h1: true,
        h2: true,
        h3: true,
        h4: true,
        h5: true,
        h6: true,
        auditIssues: true,
        internalLinks: true,
        externalLinks: true,

        sourceLinks: {
          select: {
            id: true,
            targetUrl: true,
            status: true,
            target: {
              select: {
                id: true,
                url: true,
                status: true
              }
            }
          }
        },
        targetLinks: {
          select: {
            id: true,
            status: true,
            source: {
              select: {
                id: true,
                url: true,
                status: true
              }
            }
          }
        }
      },
      cacheStrategy: {
        ttl: 30,
        swr: 60
      }
    });

    if (!url) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 });
    }

    // Shape response for frontend clarity
    return NextResponse.json({
      id: url.id,
      url: url.url,
      status: url.status,
      metaTitle: url.metaTitle,
      metaDescription: url.metaDescription,
      h1: url.h1,
      h2: url.h2,
      h3: url.h3,
      h4: url.h4,
      h5: url.h5,
      h6: url.h6,
      auditIssues: url.auditIssues,
      internalLinks: url.internalLinks,
      externalLinks: url.externalLinks,
      outgoingLinks: url.sourceLinks,
      linkedFrom: url.targetLinks
    });
  } catch (error: unknown) {
    console.error('[GET /urls/[urlId]] Fetch failed:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown server error'
      },
      { status: 500 }
    );
  }
}

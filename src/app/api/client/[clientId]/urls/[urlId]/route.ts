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
    const url = await prisma.urls.findFirst({
      where: {
        id: urlIdInt,
        clientId: clientIdInt
      },
      select: {
        id: true,
        url: true,
        status: true,
        metaTitle: true,
        metaDescription: true,
        h1: true,
        internalLinks: true,
        externalLinks: true,

        // ✅ Include internal link details (as source links from this URL)
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

    // ✅ Rename for clarity on frontend (optional)
    const { sourceLinks, ...rest } = url;
    const response = {
      ...rest,
      internalLinkDetails: sourceLinks // renamed for frontend consumption
    };

    return NextResponse.json(response);
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

// FILE: src/app/api/client/[clientId]/audits/latest/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import type { Crawl, Audit } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient().$extends(withAccelerate());

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await ctx.params;
  const id = parseInt(clientId);

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
  }

  try {
    const latestCrawls = await prisma.crawl.findMany({
      where: { clientId: id },
      orderBy: { createdAt: 'desc' },
      take: 2,
      include: { audit: true },
      cacheStrategy: {
        ttl: 0,
        swr: 60
      }
    });

    const [latest, previous] = latestCrawls as Array<
      Crawl & { audit: Audit | null }
    >;

    if (!latest?.audit) {
      return NextResponse.json(
        { error: 'No audit data found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      latest: latest.audit,
      previous: previous?.audit ?? null
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch audit data' },
      { status: 500 }
    );
  }
}

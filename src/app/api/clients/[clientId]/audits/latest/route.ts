import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { PrismaClient, type Crawl, type Audit } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import { auth } from '@clerk/nextjs/server';
import { ensureClientAccess } from '@/lib/auth/memberships';

const prisma = new PrismaClient().$extends(withAccelerate());

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ clientId: string }> }
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { clientId } = await ctx.params;
  const id = parseInt(clientId);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
  }

  const membership = await ensureClientAccess(userId, id);
  if (!membership)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const latestCrawls = await prisma.crawl.findMany({
      where: { clientId: id },
      orderBy: { createdAt: 'desc' },
      take: 2,
      include: { audit: true },
      cacheStrategy: { ttl: 0, swr: 60 }
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
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch audit data' },
      { status: 500 }
    );
  }
}

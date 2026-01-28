import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import { auth } from '@clerk/nextjs/server';
import { ensureClientAccess } from '@/lib/auth/memberships';

const prisma = new PrismaClient().$extends(withAccelerate());

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
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

  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') ?? '1');
  const perPage = parseInt(searchParams.get('perPage') ?? '10');
  const skip = (page - 1) * perPage;

  try {
    // Get latest crawl first
    const latestCrawl = await prisma.crawl.findFirst({
      where: { clientId: id },
      orderBy: { createdAt: 'desc' },
      select: { id: true }
    });

    if (!latestCrawl) {
      return NextResponse.json({ clusters: [], totalCount: 0 });
    }

    const [clusters, totalCount] = await Promise.all([
      prisma.embeddingCluster.findMany({
        where: { crawlId: latestCrawl.id },
        skip,
        take: perPage,
        orderBy: { density: 'desc' },
        include: {
          _count: {
            select: { members: true }
          }
        }
      }),
      prisma.embeddingCluster.count({
        where: { crawlId: latestCrawl.id }
      })
    ]);

    return NextResponse.json({
      clusters: clusters.map((c: any) => ({
        id: c.id,
        label: c.label,
        density: c.density,
        memberCount: c._count.members
      })),
      totalCount
    });
  } catch (error) {
    console.error('Failed to fetch clusters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clusters' },
      { status: 500 }
    );
  }
}

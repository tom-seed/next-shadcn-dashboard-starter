import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import { auth } from '@clerk/nextjs/server';
import { ensureClientAccess } from '@/lib/auth/memberships';

const prisma = new PrismaClient().$extends(withAccelerate());

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { clientId } = await params;

  const defaultResponse = {
    inlinks: [],
    totalCount: 0,
    page: 1,
    perPage: 10
  };

  const id = parseInt(clientId);
  if (isNaN(id)) {
    return NextResponse.json(
      { ...defaultResponse, error: 'Invalid client ID' },
      { status: 400 }
    );
  }

  const membership = await ensureClientAccess(userId, id);

  if (!membership) {
    return NextResponse.json(
      { ...defaultResponse, error: 'Forbidden' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = Math.min(parseInt(searchParams.get('perPage') || '10'), 100);
  const skip = (page - 1) * perPage;
  const targetUrl = searchParams.get('targetUrl');

  try {
    // Get latest crawl for the client
    const latestCrawl = await prisma.crawl.findFirst({
      where: { clientId: id },
      orderBy: { createdAt: 'desc' },
      cacheStrategy: { ttl: 3600 * 24, swr: 3600 * 24 * 3 }
    });

    if (!latestCrawl) {
      return NextResponse.json(
        { ...defaultResponse, error: 'No crawl found' },
        { status: 404 }
      );
    }

    // Build where clause
    const whereClause = {
      clientId: id,
      crawlId: latestCrawl.id,
      ...(targetUrl && { targetUrl })
    };

    const [inlinks, totalCount] = await Promise.all([
      prisma.internalLink.findMany({
        where: whereClause,
        include: {
          source: {
            select: {
              id: true,
              url: true,
              status: true
            }
          },
          target: {
            select: {
              id: true,
              url: true,
              status: true
            }
          }
        },
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.internalLink.count({
        where: whereClause
      })
    ]);

    const formatted = inlinks.map((link) => ({
      id: link.id,
      sourceId: link.sourceId,
      sourceUrl: link.source.url,
      sourceStatus: link.source.status,
      targetId: link.targetId,
      targetUrl: link.targetUrl,
      targetStatus: link.target?.status,
      follow: link.follow,
      createdAt: link.createdAt
    }));

    return NextResponse.json({
      inlinks: formatted,
      totalCount,
      page,
      perPage,
      crawlId: latestCrawl.id
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('❌ API error:', err);
    return NextResponse.json(
      { ...defaultResponse, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

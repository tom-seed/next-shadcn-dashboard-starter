// FILE: src/app/api/clients/[clientId]/urls/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';
import { ensureClientAccess } from '@/lib/auth/memberships';
import prisma from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { clientId } = await params;
  const id = parseInt(clientId);

  const defaultResponse = {
    urls: [],
    totalCount: 0,
    page: 1,
    perPage: 10
  };

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
  const perPage = Math.min(parseInt(searchParams.get('perPage') || '10'), 50);
  const skip = (page - 1) * perPage;

  const urlFilter = searchParams.get('url') || '';
  const metaTitleFilter = searchParams.get('metaTitle') || '';
  const metaDescriptionFilter = searchParams.get('metaDescription') || '';
  const canonicalFilter = searchParams.get('canonical') || '';
  const h1Filter = searchParams.get('h1') || '';
  const statusFilter = searchParams.get('status');
  const crawlIdParam = searchParams.get('crawlId');
  const crawlId = crawlIdParam ? parseInt(crawlIdParam) : null;

  const ALLOWED_SORT_FIELDS = [
    'url',
    'metaTitle',
    'metaDescription',
    'canonical',
    'h1',
    'status',
    'createdAt'
  ] as const;

  let orderBy: Prisma.UrlsOrderByWithRelationInput[] = [];

  const rawSorts = searchParams.getAll('sort');
  try {
    const orderByParsed = rawSorts.flatMap((entry) => {
      try {
        const parsed = JSON.parse(entry);
        if (Array.isArray(parsed)) {
          return parsed.flatMap(({ id, desc }) => {
            if (ALLOWED_SORT_FIELDS.includes(id) && typeof desc === 'boolean') {
              return [{ [id]: desc ? 'desc' : 'asc' }];
            }
            return [];
          });
        }
      } catch (e) {}
      return [];
    });

    orderBy = orderByParsed;
  } catch (err) {}

  try {
    const filters: any[] = [];

    if (urlFilter) {
      filters.push({
        url: {
          contains: urlFilter,
          mode: 'insensitive'
        }
      });
    }

    if (metaTitleFilter) {
      filters.push({
        metaTitle: {
          contains: metaTitleFilter,
          mode: 'insensitive'
        }
      });
    }

    if (metaDescriptionFilter) {
      filters.push({
        metaDescription: {
          contains: metaDescriptionFilter,
          mode: 'insensitive'
        }
      });
    }

    if (canonicalFilter) {
      filters.push({
        canonical: {
          contains: canonicalFilter,
          mode: 'insensitive'
        }
      });
    }

    if (h1Filter) {
      filters.push({
        h1: {
          contains: h1Filter,
          mode: 'insensitive'
        }
      });
    }

    if (statusFilter) {
      const prefix = parseInt(statusFilter);
      if (!isNaN(prefix)) {
        if (prefix === 200) {
          filters.push({ status: 200 });
        } else if (prefix >= 300 && prefix < 600) {
          filters.push({
            status: {
              gte: prefix,
              lt: prefix + 100
            }
          });
        }
      }
    }

    const whereClause: Prisma.UrlsWhereInput = {
      clientId: id,
      ...(crawlId ? { crawlId } : {}),
      ...(filters.length > 0 ? { AND: filters } : {})
    };

    const [urls, totalCount] = await Promise.all([
      prisma.urls.findMany({
        where: whereClause,
        orderBy: orderBy.length > 0 ? orderBy : [{ createdAt: 'desc' }],
        skip,
        take: perPage
      }),
      prisma.urls.count({ where: whereClause })
    ]);

    return NextResponse.json({
      urls,
      totalCount,
      page,
      perPage
    });
  } catch (err) {
    return NextResponse.json(
      { ...defaultResponse, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

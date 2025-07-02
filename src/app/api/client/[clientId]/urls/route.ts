// ✅ FILE: src/app/api/client/[clientId]/urls/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient().$extends(withAccelerate());

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
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

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = Math.min(parseInt(searchParams.get('perPage') || '10'), 50);
  const skip = (page - 1) * perPage;

  const urlFilter = searchParams.get('url') || '';
  const metaTitleFilter = searchParams.get('metaTitle') || '';
  const statusFilter = searchParams.get('status');

  const ALLOWED_SORT_FIELDS = [
    'url',
    'metaTitle',
    'status',
    'createdAt'
  ] as const;

  let orderBy: Prisma.UrlsOrderByWithRelationInput[] = [];

  const rawSorts = searchParams.getAll('sort'); // gets ALL values (especially useful when added via query.append)
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

    const whereClause = {
      clientId: id,
      ...(filters.length > 0 ? { AND: filters } : {})
    };

    const [urls, totalCount] = await Promise.all([
      prisma.urls.findMany({
        where: whereClause,
        orderBy: orderBy.length > 0 ? orderBy : [{ createdAt: 'desc' }],
        skip,
        take: perPage,
        cacheStrategy: {
          ttl: 30,
          swr: 60
        }
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

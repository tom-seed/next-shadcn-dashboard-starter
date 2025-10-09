// FILE: src/app/api/clients/[clientId]/graphs/status-code-trends/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import { auth } from '@clerk/nextjs/server';
import { ensureClientAccess } from '@/lib/auth/memberships';

const prisma = new PrismaClient().$extends(withAccelerate());

export async function GET(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const clientId = pathParts[pathParts.indexOf('clients') + 1];

  const id = parseInt(clientId);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
  }

  const membership = await ensureClientAccess(userId, id);

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const audits = await prisma.audit.findMany({
      where: { clientId: id },
      orderBy: { createdAt: 'asc' },
      cacheStrategy: {
        ttl: 0,
        swr: 60
      }
    });

    const EXCLUDE_KEYS = new Set([
      'id',
      'clientId',
      'crawlId',
      'createdAt',
      'updatedAt',
      'score',
      'pages_200_response',
      'pages_3xx_response',
      'pages_4xx_response',
      'pages_5xx_response'
    ]);

    const trendData = audits.map((audit) => {
      const totals = Object.entries(audit).reduce(
        (acc, [key, value]) => {
          if (EXCLUDE_KEYS.has(key)) return acc;
          if (typeof value === 'number') {
            acc.totalIssues += value ?? 0;
          }
          return acc;
        },
        { totalIssues: 0 }
      );

      return {
        date: audit.createdAt.toISOString().split('T')[0],
        '2xx': audit.pages_200_response ?? 0,
        '3xx': audit.pages_3xx_response ?? 0,
        '4xx': audit.pages_4xx_response ?? 0,
        '5xx': audit.pages_5xx_response ?? 0,
        pagesCrawled: audit.pages_200_response ?? 0,
        totalIssues: totals.totalIssues
      };
    });

    return NextResponse.json({ data: trendData });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

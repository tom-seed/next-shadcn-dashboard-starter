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
      select: {
        createdAt: true,
        pages_200_response: true,
        pages_3xx_response: true,
        pages_4xx_response: true,
        pages_5xx_response: true
      },
      cacheStrategy: {
        ttl: 0,
        swr: 60
      }
    });

    const trendData = audits.map((audit) => ({
      date: audit.createdAt.toISOString().split('T')[0],
      '2xx': audit.pages_200_response,
      '3xx': audit.pages_3xx_response,
      '4xx': audit.pages_4xx_response,
      '5xx': audit.pages_5xx_response
    }));

    return NextResponse.json({ data: trendData });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

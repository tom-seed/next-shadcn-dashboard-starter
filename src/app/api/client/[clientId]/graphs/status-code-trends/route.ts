// FILE: src/app/api/client/[clientId]/graphs/status-code-trends/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient().$extends(withAccelerate());

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const id = parseInt(clientId);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
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
        ttl: 3600 * 24,
        swr: 3600 * 24 * 3
      }
    });

    const trendData = audits.map((audit) => ({
      date: audit.createdAt.toISOString().split('T')[0], // Format: YYYY-MM-DD
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

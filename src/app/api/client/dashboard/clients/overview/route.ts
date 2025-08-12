import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient().$extends(withAccelerate());

type ClientWithCrawls = {
  id: number;
  name: string;
  url: string | null;
  cron: string | null;
  crawls: Array<{
    id: number;
    createdAt: Date;
    audit: {
      score: number | null;
      pages_200_response: number | null;
      pages_3xx_response: number | null;
      pages_4xx_response: number | null;
      pages_5xx_response: number | null;
    } | null;
  }>;
};

export async function GET() {
  try {
    const clients = (await prisma.client.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        url: true,
        cron: true,
        crawls: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            createdAt: true,
            audit: {
              select: {
                score: true,
                pages_200_response: true,
                pages_3xx_response: true,
                pages_4xx_response: true,
                pages_5xx_response: true
              }
            }
          }
        }
      },
      cacheStrategy: { ttl: 60, swr: 60 * 10 }
    })) as ClientWithCrawls[];

    const data = clients.map((c) => {
      const latest = c.crawls?.[0] ?? null;
      const audit = latest?.audit ?? null;
      const urlsCrawled = audit
        ? (audit.pages_200_response ?? 0) +
          (audit.pages_3xx_response ?? 0) +
          (audit.pages_4xx_response ?? 0) +
          (audit.pages_5xx_response ?? 0)
        : 0;

      return {
        id: c.id,
        name: c.name,
        url: c.url,
        cron: c.cron,
        latestCrawl: latest
          ? {
              id: latest.id,
              createdAt: latest.createdAt,
              auditScore: audit?.score ?? null,
              urlsCrawled,
              statusCounts: audit
                ? {
                    '200': audit.pages_200_response ?? 0,
                    '3xx': audit.pages_3xx_response ?? 0,
                    '4xx': audit.pages_4xx_response ?? 0,
                    '5xx': audit.pages_5xx_response ?? 0
                  }
                : { '200': 0, '3xx': 0, '4xx': 0, '5xx': 0 }
            }
          : null
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

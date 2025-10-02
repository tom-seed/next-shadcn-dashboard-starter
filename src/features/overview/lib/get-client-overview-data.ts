import 'server-only';
import prisma from '@/lib/db';

export async function getClientOverviewData(clientId: number) {
  const [client, audits, latestCrawl] = await Promise.all([
    prisma.client.findUnique({
      where: { id: clientId }
    }),
    prisma.audit.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      take: 2
    }),
    prisma.crawl.findFirst({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        state: true,
        createdAt: true
      }
    })
  ]);

  return {
    client,
    latest: audits[0],
    previous: audits[1],
    latestCrawl
  };
}

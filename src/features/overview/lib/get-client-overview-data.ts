import 'server-only';
import { unstable_cache as cache } from 'next/cache';
import prisma from '@/lib/db';

export const getClientOverviewData = cache(
  async (clientId: number) => {
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });

    const audits = await prisma.audit.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      take: 2
    });

    return { client, latest: audits[0], previous: audits[1] };
  },
  ['client-overview'],
  {
    tags: ['client-overview']
  }
);

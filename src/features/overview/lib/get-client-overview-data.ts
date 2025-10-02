import 'server-only';
import prisma from '@/lib/db';

export async function getClientOverviewData(clientId: number) {
  const client = await prisma.client.findUnique({
    where: { id: clientId }
  });

  const audits = await prisma.audit.findMany({
    where: { clientId },
    orderBy: { createdAt: 'desc' },
    take: 2
  });

  return { client, latest: audits[0], previous: audits[1] };
}

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function getClientDashboardData(clientId: number) {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  const audit = await prisma.audit.findFirst({
    where: { clientId },
    orderBy: { createdAt: 'desc' }
  });
  return { client, audit };
}

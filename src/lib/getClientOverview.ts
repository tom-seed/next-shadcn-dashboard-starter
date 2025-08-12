// lib/getClientsOverview.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getClientsOverview() {
  return prisma.client.findMany({
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
    orderBy: { name: 'asc' }
  });
}

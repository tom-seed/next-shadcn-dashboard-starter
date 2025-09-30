// lib/getClientsOverview.ts
import prisma from '@/lib/db';

export async function getClientsOverviewForUser(clerkUserId: string) {
  return prisma.client.findMany({
    where: {
      memberships: {
        some: {
          clerkUserId
        }
      }
    },
    select: {
      id: true,
      name: true,
      url: true,
      cron: true,
      createdAt: true,
      memberships: {
        where: { clerkUserId },
        select: {
          role: true
        }
      },
      crawls: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          createdAt: true,
          state: true,
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

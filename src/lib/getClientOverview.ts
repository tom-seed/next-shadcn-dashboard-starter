import prisma from '@/lib/db';
import { isGlobalAdmin } from '@/lib/auth/global-role';

export async function getClientsOverviewForUser(clerkUserId: string) {
  const globalAdmin = await isGlobalAdmin(clerkUserId);
  const isDev = process.env.NODE_ENV === 'development';

  return prisma.client.findMany({
    where:
      globalAdmin || isDev
        ? {}
        : {
            memberships: {
              some: { clerkUserId }
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
        select: { role: true }
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

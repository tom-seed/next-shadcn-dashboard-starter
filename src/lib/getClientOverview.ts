import prisma from '@/lib/db';

type Options = { asAdmin?: boolean };

/**
 * Returns a list of clients for the overview table.
 * - If `asAdmin` is true, returns ALL clients.
 * - Otherwise, returns only the clients the user is a member of.
 */
export async function getClientsOverviewForUser(
  clerkUserId: string,
  opts: Options = {}
) {
  if (opts.asAdmin) {
    return prisma.client.findMany({
      select: {
        id: true,
        name: true,
        url: true,
        cron: true,
        createdAt: true,
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

  // non-admin: only memberships
  return prisma.client.findMany({
    where: {
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

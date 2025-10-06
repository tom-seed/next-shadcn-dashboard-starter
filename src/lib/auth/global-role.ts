import { GlobalRole } from '@prisma/client';
import prisma from '@/lib/db';

export async function isGlobalAdmin(userId: string): Promise<boolean> {
  if (!userId) return false;

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { globalRole: true }
  });

  return user?.globalRole === GlobalRole.INTERNAL_ADMIN;
}

export async function getGlobalRole(userId: string): Promise<GlobalRole> {
  if (!userId) return GlobalRole.NONE;

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { globalRole: true }
  });

  return user?.globalRole ?? GlobalRole.NONE;
}

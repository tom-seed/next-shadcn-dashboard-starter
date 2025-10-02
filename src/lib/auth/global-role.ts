import prisma from '@/lib/db';
import { GlobalRole } from '@prisma/client';

export async function getGlobalRoleForUser(
  clerkUserId: string
): Promise<GlobalRole> {
  if (!clerkUserId) return GlobalRole.NONE;
  const u = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { globalRole: true }
  });
  return u?.globalRole ?? GlobalRole.NONE;
}

export async function isGlobalAdmin(clerkUserId: string): Promise<boolean> {
  const role = await getGlobalRoleForUser(clerkUserId);
  return role === GlobalRole.INTERNAL_ADMIN;
}

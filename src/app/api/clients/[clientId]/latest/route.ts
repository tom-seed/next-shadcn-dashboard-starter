import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { getClientMembershipsForUser } from '@/lib/auth/memberships';
import { isGlobalAdmin } from '@/lib/auth/global-role'; // remove if you don't have it

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ clientId: string }> }
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { clientId } = await ctx.params;
  const clientIdNum = Number(clientId);
  if (!Number.isFinite(clientIdNum)) {
    return NextResponse.json({ error: 'Bad clientId' }, { status: 400 });
  }

  const memberships = await getClientMembershipsForUser(userId);
  const allowed =
    (await isGlobalAdmin(userId).catch(() => false)) ||
    memberships.some((m) => m.clientId === clientIdNum);
  if (!allowed)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const audits = await prisma.audit.findMany({
    where: { clientId: clientIdNum },
    orderBy: { createdAt: 'desc' },
    take: 2,
    select: {
      id: true,
      createdAt: true,
      crawlId: true,
      score: true,
      pages_200_response: true,
      pages_3xx_response: true,
      pages_4xx_response: true,
      pages_5xx_response: true
    }
  });

  const [latest, previous] = audits;
  return NextResponse.json({
    latest: latest ?? null,
    previous: previous ?? null
  });
}

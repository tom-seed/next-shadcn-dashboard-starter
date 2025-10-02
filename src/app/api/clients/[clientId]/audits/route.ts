import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import { auth } from '@clerk/nextjs/server';
import { ensureClientAccess } from '@/lib/auth/memberships';

const prisma = new PrismaClient().$extends(withAccelerate());

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ clientId: string }> }
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { clientId } = await ctx.params;
  const id = parseInt(clientId);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
  }

  const membership = await ensureClientAccess(userId, id);
  if (!membership)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const audit = await prisma.audit.findFirst({
    where: { clientId: id },
    orderBy: { createdAt: 'desc' },
    cacheStrategy: { ttl: 0, swr: 60 }
  });

  if (!audit)
    return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
  return NextResponse.json(audit);
}

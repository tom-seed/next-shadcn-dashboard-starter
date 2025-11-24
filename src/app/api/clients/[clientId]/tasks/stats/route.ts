import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ensureClientAccess } from '@/lib/auth/memberships';
import prisma from '@/lib/db';
import { startOfWeek } from 'date-fns';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { clientId } = await params;
  const id = parseInt(clientId);

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
  }

  const membership = await ensureClientAccess(userId, id);

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const [totalOpen, criticalOpen, fixedThisWeek] = await Promise.all([
      prisma.auditIssue.count({
        where: {
          clientId: id,
          status: { in: ['OPEN', 'IN_PROGRESS'] }
        }
      }),
      prisma.auditIssue.count({
        where: {
          clientId: id,
          status: { in: ['OPEN', 'IN_PROGRESS'] },
          priority: 'CRITICAL'
        }
      }),
      prisma.auditIssue.count({
        where: {
          clientId: id,
          status: 'FIXED',
          fixedAt: {
            gte: startOfWeek(new Date())
          }
        }
      })
    ]);

    return NextResponse.json({
      totalOpen,
      criticalOpen,
      fixedThisWeek
    });
  } catch (err) {
    console.error('Error fetching task stats:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';
import { ensureClientAccess } from '@/lib/auth/memberships';
import prisma from '@/lib/db';

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

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = Math.min(parseInt(searchParams.get('perPage') || '20'), 100);
  const skip = (page - 1) * perPage;

  const statusFilter = searchParams.get('status');
  const priorityFilter = searchParams.get('priority');
  const search = searchParams.get('search');

  const whereClause: Prisma.TaskWhereInput = {
    clientId: id,
    ...(statusFilter ? { status: statusFilter as any } : {}),
    ...(priorityFilter ? { priority: priorityFilter as any } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        }
      : {})
  };

  const sortParam = searchParams.get('sort');
  let orderBy: Prisma.TaskOrderByWithRelationInput = { createdAt: 'desc' };

  if (sortParam) {
    const [field, direction] = sortParam.split(':');
    if (['priority', 'status', 'createdAt', 'title'].includes(field)) {
      orderBy = { [field]: direction === 'asc' ? 'asc' : 'desc' };
    }
  }

  try {
    const [tasks, totalCount] = await Promise.all([
      prisma.task.findMany({
        where: whereClause,
        include: {
          url: {
            select: {
              url: true
            }
          },
          auditIssue: {
            select: {
              issueKey: true
            }
          }
        },
        orderBy,
        skip,
        take: perPage
      }),
      prisma.task.count({ where: whereClause })
    ]);

    return NextResponse.json({
      tasks,
      totalCount,
      page,
      perPage
    });
  } catch (err) {
    console.error('Error fetching tasks:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

  if (
    !membership ||
    ['CLIENT_VIEWER', 'AGENCY_ANALYST'].includes(membership.role)
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { ids, status, priority } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
    }

    const updateData: Prisma.TaskUpdateInput = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;

    const result = await prisma.task.updateMany({
      where: {
        clientId: id,
        id: { in: ids }
      },
      data: updateData
    });

    return NextResponse.json({ count: result.count });
  } catch (err) {
    console.error('Error updating tasks:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(
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

  if (
    !membership ||
    ['CLIENT_VIEWER', 'AGENCY_ANALYST'].includes(membership.role)
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      title,
      description,
      status,
      priority,
      assigneeClerkUserId,
      urlId,
      auditIssueId
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        clientId: id,
        title,
        description,
        status: status || 'OPEN',
        priority: priority || 'MEDIUM',
        assigneeClerkUserId,
        urlId: urlId ? parseInt(urlId) : undefined,
        auditIssueId: auditIssueId ? parseInt(auditIssueId) : undefined
      }
    });

    return NextResponse.json(task);
  } catch (err) {
    console.error('Error creating task:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

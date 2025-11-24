import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ensureClientAccess } from '@/lib/auth/memberships';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string; taskId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { clientId, taskId } = await params;
  const id = parseInt(clientId);
  const tId = parseInt(taskId);

  if (isNaN(id) || isNaN(tId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const membership = await ensureClientAccess(userId, id);

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const task = await prisma.task.findUnique({
      where: {
        id: tId,
        clientId: id
      },
      include: {
        comments: {
          orderBy: {
            createdAt: 'asc'
          }
        },
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
      }
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (err) {
    console.error('Error fetching task:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string; taskId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { clientId, taskId } = await params;
  const id = parseInt(clientId);
  const tId = parseInt(taskId);

  if (isNaN(id) || isNaN(tId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
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
    const { title, description, status, priority, assigneeClerkUserId } = body;

    const updateData: Prisma.TaskUpdateInput = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (assigneeClerkUserId !== undefined)
      updateData.assigneeClerkUserId = assigneeClerkUserId;

    const task = await prisma.task.update({
      where: {
        id: tId,
        clientId: id
      },
      data: updateData
    });

    return NextResponse.json(task);
  } catch (err) {
    console.error('Error updating task:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

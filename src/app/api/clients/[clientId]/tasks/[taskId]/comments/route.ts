import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ensureClientAccess } from '@/lib/auth/memberships';
import prisma from '@/lib/db';

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
    const comments = await prisma.comment.findMany({
      where: {
        taskId: tId,
        Task: {
          clientId: id
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json(comments);
  } catch (err) {
    console.error('Error fetching comments:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const body = await req.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Verify task belongs to client
    const task = await prisma.task.findUnique({
      where: {
        id: tId,
        clientId: id
      }
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        taskId: tId,
        authorClerkUserId: userId,
        content
      }
    });

    return NextResponse.json(comment);
  } catch (err) {
    console.error('Error creating comment:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

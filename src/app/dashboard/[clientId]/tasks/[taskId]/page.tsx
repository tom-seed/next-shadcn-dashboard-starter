import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { TaskDetailView } from '@/features/tasks/task-detail-view';
import { auth } from '@clerk/nextjs/server';
import { ensureClientAccess } from '@/lib/auth/memberships';
import prisma from '@/lib/db';

interface PageProps {
  params: Promise<{ clientId: string; taskId: string }>;
}

export default async function Page({ params }: PageProps) {
  const { clientId, taskId } = await params;
  const { userId } = await auth();

  if (!userId) {
    return <div>Unauthorized</div>;
  }

  const id = parseInt(clientId);
  const tId = parseInt(taskId);

  if (isNaN(id) || isNaN(tId)) {
    return notFound();
  }

  const membership = await ensureClientAccess(userId, id);

  if (!membership) {
    return <div>Forbidden</div>;
  }

  const task = await prisma.task.findUnique({
    where: {
      id: tId,
      clientId: id
    },
    include: {
      Urls: {
        select: {
          url: true
        }
      },
      AuditIssue: {
        select: {
          issueKey: true
        }
      }
    }
  });

  if (!task) {
    return notFound();
  }

  // Serialize dates for client component
  const serializedTask = {
    ...task,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    // Ensure nullable fields are handled
    description: task.description,
    assigneeClerkUserId: task.assigneeClerkUserId,
    url: task.Urls,
    auditIssue: task.AuditIssue
  };

  return (
    <PageContainer scrollable>
      <TaskDetailView clientId={id} initialTask={serializedTask} />
    </PageContainer>
  );
}

import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { ensureClientAccess } from '@/lib/auth/memberships';
import TaskView from '@/features/tasks/task-view';

export default async function TasksPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect('/auth/sign-in');
  }

  const cid = Number(clientId);
  if (!Number.isFinite(cid)) {
    notFound();
  }

  const membership = await ensureClientAccess(userId, cid);

  if (!membership) {
    notFound();
  }

  return (
    <PageContainer>
      <div className='space-y-4'>
        <Heading
          title='Audit Tasks'
          description='Manage and track SEO issues across your site.'
        />
        <TaskView clientId={cid} />
      </div>
    </PageContainer>
  );
}

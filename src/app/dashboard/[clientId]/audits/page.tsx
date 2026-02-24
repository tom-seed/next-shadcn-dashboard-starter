import { notFound, redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import PageContainer from '@/components/layout/page-container';
import { ensureClientAccess } from '@/lib/auth/memberships';
import { getAuditComparisonData } from '@/features/audit/lib/get-audit-comparison-data';
import AuditComparisonView from '@/features/audit/audit-comparison-view';

export default async function Page({
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

  const { latest, previous, semantic } = await getAuditComparisonData(cid);

  if (!latest) {
    return (
      <PageContainer>
        <div className='flex min-h-[60vh] flex-1 flex-col items-center justify-center space-y-2'>
          <p className='text-muted-foreground text-sm'>
            No audit data available yet.
          </p>
          <p className='text-muted-foreground text-xs'>
            Start a crawl to generate your first audit.
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <AuditComparisonView
        clientId={clientId}
        latest={latest}
        previous={previous}
        semantic={semantic}
      />
    </PageContainer>
  );
}

// src/app/dashboard/[clientId]/audits/page.tsx
import PageContainer from '@/components/layout/page-container';
import { Suspense } from 'react';
import AuditComparisonView from '@/features/audit/audit-comparison-view';

interface PageProps {
  params: Promise<{ clientId: string }>; // 👈 MUST be a Promise now!
}

export default async function Page({ params }: PageProps) {
  const { clientId } = await params; // 👈 MUST await here!

  return (
    <PageContainer scrollable>
      <Suspense fallback={<div>Loading audits...</div>}>
        <AuditComparisonView clientId={clientId} />
      </Suspense>
    </PageContainer>
  );
}

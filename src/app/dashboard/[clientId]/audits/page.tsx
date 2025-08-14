// FILE: src/app/dashboard/[clientId]/audits/page.tsx
import AuditComparisonView from '@/features/audit/audit-comparison-view';
import PageContainer from '@/components/layout/page-container';

export default async function Page({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  return (
    <PageContainer>
      <AuditComparisonView clientId={clientId} />
    </PageContainer>
  );
}

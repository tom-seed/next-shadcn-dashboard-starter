// FILE: src/app/dashboard/[clientId]/audits/issues/[issueKey]/page.tsx

import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { Suspense } from 'react';
import AuditIssueListingPage from '@/features/audit/issue-table/audit-listing-page';

export const metadata = {
  title: 'Dashboard: Audit Issue'
};

interface PageProps {
  params: Promise<{ clientId: string; issueKey: string }>;
}

export default async function AuditIssuePage({ params }: PageProps) {
  const { clientId, issueKey: rawIssueKey } = await params;
  const issueKey = rawIssueKey.replaceAll('-', '_'); // for internal data lookup

  return (
    <PageContainer scrollable>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Audit Issue'
            description='View all URLs for this issue.'
          />
        </div>
        <Separator />
        <Suspense
          fallback={<DataTableSkeleton columnCount={3} rowCount={10} />}
        >
          <AuditIssueListingPage clientId={clientId} issueKey={issueKey} />
        </Suspense>
      </div>
    </PageContainer>
  );
}

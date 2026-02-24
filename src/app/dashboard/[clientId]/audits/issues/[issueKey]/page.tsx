import type { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { Suspense } from 'react';
import AuditIssueListingPage from '@/features/audit/issue-table/audit-listing-page';
import { getIssueByField } from '@/features/audit/lib/issue-registry';

interface PageProps {
  params: Promise<{ clientId: string; issueKey: string }>;
}

export async function generateMetadata({
  params
}: PageProps): Promise<Metadata> {
  const { issueKey: rawIssueKey } = await params;
  const field = rawIssueKey.replaceAll('-', '_');
  const issue = getIssueByField(field);
  return {
    title: issue ? `Dashboard: ${issue.label}` : 'Dashboard: Audit Issue'
  };
}

export default async function AuditIssuePage({ params }: PageProps) {
  const { clientId, issueKey: rawIssueKey } = await params;
  const issueKey = rawIssueKey.replaceAll('-', '_');
  const issue = getIssueByField(issueKey);

  return (
    <PageContainer scrollable>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title={issue?.label ?? 'Audit Issue'}
            description={issue?.description ?? 'View all URLs for this issue.'}
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

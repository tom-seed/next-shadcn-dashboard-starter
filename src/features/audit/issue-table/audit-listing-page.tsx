// FILE: src/features/audit/issue-table/audit-listing-page.tsx
import AuditIssueListingPageClient from './view-client';

interface AuditIssueListingPageProps {
  clientId: string;
  issueKey: string;
}

export default async function AuditIssueListingPage({
  clientId,
  issueKey
}: AuditIssueListingPageProps) {
  return (
    <AuditIssueListingPageClient
      clientId={parseInt(clientId)}
      issueKey={issueKey}
    />
  );
}

// FILE: src/features/url-table/url-listing-page.tsx
import UrlListingPageClient from './url-listing-page-client';

interface UrlListingPageProps {
  clientId: string;
  crawlId?: number;
}

export default async function UrlListingPage({
  clientId,
  crawlId
}: UrlListingPageProps) {
  return (
    <UrlListingPageClient clientId={parseInt(clientId)} crawlId={crawlId} />
  );
}

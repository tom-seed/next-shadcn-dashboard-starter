import UrlListingPageClient from './url-listing-page-client';

interface UrlListingPageProps {
  clientId: string;
}

export default async function UrlListingPage({
  clientId
}: UrlListingPageProps) {
  return <UrlListingPageClient clientId={parseInt(clientId)} />;
}

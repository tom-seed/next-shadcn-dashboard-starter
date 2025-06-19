// src/features/url-table/url-listing-page.tsx
import { getUrls } from '@/lib/api/urls';
import UrlListingPageClient from './url-listing-page-client';

type Props = {
  clientId: string;
};

export default async function UrlListingPage({ clientId }: Props) {
  const urls = await getUrls(clientId);

  return <UrlListingPageClient urls={urls} clientId={parseInt(clientId)} />;
}

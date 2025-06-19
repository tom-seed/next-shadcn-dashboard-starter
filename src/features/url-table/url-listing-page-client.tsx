// src/features/url-table/url-listing-page-client.tsx
'use client';

import { Urls } from '@prisma/client';
import { UrlTable } from './table';
import { getUrlColumns } from './columns';

type Props = {
  clientId: number;
  urls: Urls[];
};

export default function UrlListingPageClient({ clientId, urls }: Props) {
  const columns = getUrlColumns(clientId);
  return <UrlTable data={urls} totalItems={urls.length} columns={columns} />;
}

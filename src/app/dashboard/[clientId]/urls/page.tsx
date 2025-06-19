import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { Suspense } from 'react';
import UrlListingPage from '@/features/url-table/url-listing-page';

export const metadata = {
  title: 'Dashboard: URLs'
};

interface PageProps {
  params: Promise<{ clientId: string }>; // 👈 MUST be a Promise now!
}

export default async function UrlsPage({ params }: PageProps) {
  const { clientId } = await params; // 👈 MUST await here!
  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='URLs'
            description='All URLs crawled for this client.'
          />
        </div>
        <Separator />
        <Suspense
          fallback={<DataTableSkeleton columnCount={3} rowCount={10} />}
        >
          <UrlListingPage clientId={clientId} />
        </Suspense>
      </div>
    </PageContainer>
  );
}

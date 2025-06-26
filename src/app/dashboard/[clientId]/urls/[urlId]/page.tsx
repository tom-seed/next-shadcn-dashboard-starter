// src/app/dashboard/[clientId]/urls/[urlId]/page.tsx
import { Suspense } from 'react';
import PageContainer from '@/components/layout/page-container';
import FormCardSkeleton from '@/components/form-card-skeleton';
import UrlViewPage from '@/features/url-table/url-view-page';

export const metadata = {
  title: 'Dashboard : URL View'
};

interface PageProps {
  params: Promise<{ clientId: string; urlId: string }>;
}

export default async function Page({ params }: PageProps) {
  const { clientId } = await params;
  const { urlId } = await params;
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <UrlViewPage clientId={clientId} urlId={urlId} />
        </Suspense>
      </div>
    </PageContainer>
  );
}

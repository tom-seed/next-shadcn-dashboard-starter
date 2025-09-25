import { PrismaClient } from '@prisma/client';
import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';

import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import UrlListingPage from '@/features/url-table/url-listing-page';
import { ensureClientAccess } from '@/lib/auth/memberships';

export const metadata = {
  title: 'Dashboard | URLs | Atlas'
};

interface PageProps {
  params: Promise<{ clientId: string }>;
}

export default async function UrlsPage({ params }: PageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/auth/sign-in');
  }

  const { clientId } = await params;
  const parsedClientId = Number(clientId);

  if (!Number.isFinite(parsedClientId)) {
    notFound();
  }

  const membership = await ensureClientAccess(userId, parsedClientId);

  if (!membership) {
    notFound();
  }

  const prisma = new PrismaClient();

  const latestCrawl = await prisma.crawl.findFirst({
    where: { clientId: parsedClientId },
    orderBy: { createdAt: 'desc' },
    select: { id: true }
  });

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
          <UrlListingPage clientId={clientId} crawlId={latestCrawl?.id} />
        </Suspense>
      </div>
    </PageContainer>
  );
}

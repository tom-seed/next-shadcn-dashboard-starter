// src/app/dashboard/[clientId]/urls/[urlId]/page.tsx
import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import FormCardSkeleton from '@/components/form-card-skeleton';
import UrlViewPage from '@/features/url-table/url-view-page';
import { ensureClientAccess } from '@/lib/auth/memberships';

export const metadata = {
  title: 'Dashboard : URL View'
};

interface PageProps {
  params: Promise<{ clientId: string; urlId: string }>;
}

export default async function Page({ params }: PageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/auth/sign-in');
  }

  const { clientId, urlId } = await params;
  const cid = Number(clientId);

  if (!Number.isFinite(cid)) {
    notFound();
  }

  const membership = await ensureClientAccess(userId, cid);

  if (!membership) {
    notFound();
  }

  return (
    <PageContainer scrollable>
      <Suspense fallback={<FormCardSkeleton />}>
        <UrlViewPage clientId={clientId} urlId={urlId} />
      </Suspense>
    </PageContainer>
  );
}

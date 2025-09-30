'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { CreateClientDialog } from '@/components/common/create-client-dialog';

export default function NewClientPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard with dialog state
    // This page is kept for backward compatibility with existing links
    router.push('/dashboard/overview');
  }, [router]);

  return (
    <PageContainer>
      <div className='space-y-4 p-4'>
        <Heading
          title='New Client'
          description='Create a new client for crawling'
        />
        <div className='flex justify-center'>
          <CreateClientDialog />
        </div>
      </div>
    </PageContainer>
  );
}

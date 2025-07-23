// src/features/overview/components/re-crawl-button.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type Props = {
  clientId: string;
  url: string;
};

export default function ReCrawlButton({ clientId, url }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReCrawl = async () => {
    setLoading(true);
    toast.info('Starting re-crawl...');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_NODE_API}/re-crawl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, url })
      });

      if (!res.ok) throw new Error('Failed to re-crawl');

      toast.success('Re-crawl started successfully');
      router.refresh(); // Optional: Refresh the data on the page
    } catch (err) {
      console.error(err);
      toast.error('Failed to start re-crawl');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleReCrawl}
      disabled={loading}
      variant='outline'
      className='gap-2'
    >
      {loading ? (
        <Loader2 className='h-4 w-4 animate-spin' />
      ) : (
        <RefreshCw className='h-4 w-4' />
      )}
      {loading ? 'Re-crawling…' : 'Re-crawl now'}
    </Button>
  );
}

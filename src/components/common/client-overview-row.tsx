'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { getClientsOverviewForUser } from '@/lib/getClientOverview';

type ClientData = Awaited<ReturnType<typeof getClientsOverviewForUser>>[0];

function formatDateTime(date?: Date | string | null) {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  } catch {
    return String(d);
  }
}

function formatCrawlState(state: 'STARTED' | 'ABORTED' | 'COMPLETED') {
  switch (state) {
    case 'STARTED':
      return <Badge className='bg-gray-500 text-white'>Started</Badge>;
    case 'ABORTED':
      return <Badge className='bg-red-500 text-white'>Aborted</Badge>;
    case 'COMPLETED':
      return <Badge className='bg-green-500 text-white'>Completed</Badge>;
  }
}

export function ClientOverviewRow({ client }: { client: ClientData }) {
  const pagesCrawled = client.crawls?.[0]?.audit?.pages_200_response ?? '—';
  const healthScore = client.crawls?.[0]?.audit?.score ?? '—';
  const crawlStatus = client.crawls?.[0]?.state ? (
    formatCrawlState(client.crawls[0].state)
  ) : (
    <Badge variant='outline'>No Crawls</Badge>
  );
  const createdDate = formatDateTime(client.createdAt);

  return (
    <Link
      key={client.id}
      href={`/dashboard/${client.id}/overview`}
      className='hover:bg-muted/50 grid grid-cols-6 items-start gap-4 p-4 transition-colors'
    >
      <div className='col-span-2 space-y-3'>
        <div>
          <p className='font-medium'>{client.name}</p>
          <p className='text-muted-foreground text-sm'>{client.url}</p>
        </div>
        <Button
          variant='outline'
          size='sm'
          onClick={(e) => {
            e.stopPropagation(); // Prevent the parent Link from firing
            // The button's own navigation is handled by the nested Link
          }}
          asChild
        >
          <Link href={`/dashboard/${client.id}/overview`}>Open portal</Link>
        </Button>
      </div>
      <div className='font-medium'>{healthScore}</div>
      <div className='font-medium'>{pagesCrawled}</div>
      <div>{crawlStatus}</div>
      <div className='text-muted-foreground'>{createdDate}</div>
    </Link>
  );
}

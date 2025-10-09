'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DeleteClientDialog } from '@/components/common/delete-client-dialog';
import { IconArrowUpRight, IconTrash } from '@tabler/icons-react';
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

export function ClientOverviewRow({
  client,
  showDelete = false
}: {
  client: ClientData;
  showDelete?: boolean;
}) {
  const pagesCrawled = client.crawls?.[0]?.audit?.pages_200_response ?? '—';
  const healthScore = client.crawls?.[0]?.audit?.score ?? '—';
  const crawlStatus = client.crawls?.[0]?.state ? (
    formatCrawlState(client.crawls[0].state)
  ) : (
    <Badge variant='outline'>No Crawls</Badge>
  );
  const createdDate = formatDateTime(client.createdAt);

  return (
    <div className='hover:bg-muted/50 grid grid-cols-6 items-start gap-4 p-4 transition-colors'>
      <div className='col-span-2 flex flex-col gap-2'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <Link
            href={`/dashboard/${client.id}/overview`}
            className='min-w-0 flex-1'
          >
            <div className='cursor-pointer'>
              <p className='font-medium'>{client.name}</p>
              <p
                className='text-muted-foreground truncate text-sm'
                title={client.url ?? undefined}
              >
                {client.url}
              </p>
            </div>
          </Link>
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='icon' asChild>
              <Link
                href={`/dashboard/${client.id}/overview`}
                aria-label={`Open ${client.name}`}
                title='Open client overview'
              >
                <IconArrowUpRight className='h-4 w-4' />
              </Link>
            </Button>
            {showDelete && (
              <DeleteClientDialog
                clientId={client.id}
                clientName={client.name}
                trigger={
                  <Button
                    variant='outline'
                    size='icon'
                    aria-label={`Delete ${client.name}`}
                    title='Delete client'
                  >
                    <IconTrash className='h-4 w-4' />
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </div>
      <div className='font-medium'>{healthScore}</div>
      <div className='font-medium'>{pagesCrawled}</div>
      <div>{crawlStatus}</div>
      <div className='text-muted-foreground'>{createdDate}</div>
    </div>
  );
}

// app/dashboard/overview/layout.tsx
import PageContainer from '@/components/layout/page-container';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Heading } from '@/components/ui/heading';
import { Button } from '@/components/ui/button';
import { getClientsOverview } from '@/lib/getClientOverview';

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

export default async function OverViewLayout() {
  const data = await getClientsOverview();

  if (!data || data.length === 0) {
    return (
      <PageContainer>
        <div className='flex w-full flex-col space-y-4'>
          <div className='flex items-center justify-between'>
            <Heading
              title='Clients'
              description='All clients and their latest crawl snapshot.'
            />
            <Button asChild>
              <Link href='/new-client'>Add New Client</Link>
            </Button>
          </div>
          <Separator />
          <div className='text-muted-foreground text-sm'>No clients found.</div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='flex w-full flex-col space-y-4'>
        <div className='flex items-center justify-between'>
          <Heading
            title='Clients'
            description='All clients and their latest crawl snapshot.'
          />
          <Button asChild>
            <Link href='/new-client'>Add New Client</Link>
          </Button>
        </div>
        <Separator />

        <div className='w-full space-y-4'>
          {data.map((client) => {
            const pagesCrawled =
              client.crawls?.[0]?.audit?.pages_200_response ?? 0;
            const lastCrawl = formatDateTime(
              client.crawls?.[0]?.createdAt ?? null
            );

            return (
              <Link
                key={client.id}
                href={`/dashboard/${client.id}/overview`}
                className='block'
              >
                <Card className='flex h-[200px] w-full flex-col p-6 transition-shadow hover:shadow-md'>
                  <div className='flex items-center justify-between'>
                    <h3 className='text-lg font-semibold'>{client.name}</h3>
                  </div>

                  <div className='mt-4 flex flex-grow flex-col space-y-3'>
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground text-sm'>
                        Pages Crawled
                      </span>
                      <span className='text-sm font-medium tabular-nums'>
                        {pagesCrawled}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground text-sm'>
                        Last Crawl
                      </span>
                      <span className='text-sm font-medium'>{lastCrawl}</span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground text-sm'>
                        Audit Score
                      </span>
                      <span className='text-sm font-medium'>
                        {client.crawls?.[0]?.audit?.score ?? 'N/A'}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}

import PageContainer from '@/components/layout/page-container';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Heading } from '@/components/ui/heading';
import { Button } from '@/components/ui/button';

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
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/api/client/dashboard/clients/overview`,
    {
      cache: 'no-store'
    }
  );

  if (!res.ok) {
    // Fallback to empty list on API error
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
          <div className='text-muted-foreground text-sm'>
            Failed to load clients.
          </div>
        </div>
      </PageContainer>
    );
  }

  const { data } = await res.json();

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
          {data.map((client: any) => {
            const pagesCrawled = client.latestCrawl?.urlsCrawled ?? 0;
            const lastCrawl = formatDateTime(
              client.latestCrawl?.createdAt ?? null
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
                        {client.latestCrawl?.auditScore ?? 'N/A'}
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

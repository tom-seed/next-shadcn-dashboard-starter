'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardAction
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarGraph } from '@/features/overview/components/bar-graph';
import { AreaGraph } from '@/features/overview/components/area-graph';
import { PieGraph } from '@/features/overview/components/pie-graph';
import { RecentSales } from '@/features/overview/components/recent-sales';
import { IconTrendingUp } from '@tabler/icons-react';
import PageContainer from '@/components/layout/page-container';

export default function ClientOverviewPage() {
  const { clientId } = useParams();
  const [client, setClient] = useState<{ id: number; name: string } | null>(
    null
  );
  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const resClient = await fetch(`/api/client/${clientId}`);
        const resAudit = await fetch(`/api/client/${clientId}/audits`);
        const clientData = await resClient.json();
        const auditData = await resAudit.json();
        setClient(clientData);
        setAudit(auditData);
      } catch (error) {
        //console.error('Error fetching client overview:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [clientId]);

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-2'>
        <div>
          <h1 className='text-2xl font-bold'>
            {loading ? (
              <Skeleton className='h-6 w-48' />
            ) : (
              `${client?.name} Overview`
            )}
          </h1>
        </div>

        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Pages Crawled</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {loading ? (
                  <Skeleton className='h-8 w-24' />
                ) : (
                  audit?.pages_200_response || 0
                )}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconTrendingUp />
                  +12.5%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                Trending up this month <IconTrendingUp className='size-4' />
              </div>
              <div className='text-muted-foreground'>
                Successful pages (200 OK)
              </div>
            </CardFooter>
          </Card>

          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>4xx Error Codes</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {loading ? (
                  <Skeleton className='h-8 w-24' />
                ) : (
                  audit?.pages_4xx_response || 0
                )}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconTrendingUp />
                  +12.5%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                Trending up this month <IconTrendingUp className='size-4' />
              </div>
              <div className='text-muted-foreground'>Error pages (4xx)</div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Missing Titles</CardDescription>
              <CardTitle className='text-3xl'>
                {loading ? (
                  <Skeleton className='h-8 w-24' />
                ) : (
                  audit?.pages_missing_title || 0
                )}
              </CardTitle>
              <CardFooter className='text-muted-foreground text-sm'>
                SEO checks
              </CardFooter>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Audit Trend</CardDescription>
              <CardTitle className='flex items-center gap-2 text-3xl'>
                <IconTrendingUp className='h-6 w-6 text-green-500' />
                +5%
              </CardTitle>
              <CardFooter className='text-muted-foreground text-sm'>
                From previous audit
              </CardFooter>
            </CardHeader>
          </Card>
        </div>

        <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
          <div className='col-span-4'>
            <AreaGraph />
          </div>
          <div className='col-span-3'>
            <PieGraph />
          </div>
          <div className='col-span-4'>
            <BarGraph />
          </div>
          <div className='col-span-3'>
            <RecentSales />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

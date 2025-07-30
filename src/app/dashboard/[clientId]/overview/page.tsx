'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardAction
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarGraph } from '@/features/overview/components/bar-graph';
import { AreaGraphStatusCodes } from '@/features/overview/components/area-graph-status-codes';
import { PieGraph } from '@/features/overview/components/pie-graph';
import { RecentSales } from '@/features/overview/components/recent-sales';
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import PageContainer from '@/components/layout/page-container';
import { getTrend } from '@/lib/helpers/getTrend';
import { CrawlLoadingSpinner } from '@/components/ui/crawl-loading-spinner';
import ReCrawlButton from '@/features/overview/components/re-crawl-button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

export default function ClientOverviewPage() {
  const { clientId } = useParams();
  const router = useRouter();
  const [client, setClient] = useState<{
    id: number;
    name: string;
    url: string;
  } | null>(null);
  const [latest, setLatest] = useState<any>(null);
  const [previous, setPrevious] = useState<any>(null);

  useEffect(() => {
    if (!clientId) return;

    let isCancelled = false;
    let eventSource: EventSource;

    const fetchClient = async () => {
      try {
        const res = await fetch(`/api/client/${clientId}`);
        const clientData = await res.json();
        if (!isCancelled) setClient(clientData);
      } catch {
        console.warn('Failed to fetch client');
      }
    };

    const checkLatestAudit = async () => {
      try {
        const res = await fetch(`/api/client/${clientId}/audits/latest`);
        if (res.ok) {
          const { latest, previous } = await res.json();
          if (!isCancelled && latest) {
            setLatest(latest);
            setPrevious(previous);
            return true;
          }
        }
      } catch {
        // ignore
      }
      return false;
    };

    const listenForAudit = () => {
      eventSource = new EventSource(
        `${process.env.NEXT_PUBLIC_NODE_API}/sse/events?clientId=${clientId}`
      );

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'audit_complete') {
            setLatest(data.latest);
            setPrevious(data.previous);
            eventSource.close();
          }
        } catch (err) {
          console.error('Failed to parse SSE event', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE error:', err);
        eventSource.close();
      };
    };

    fetchClient();
    checkLatestAudit().then((hasAudit) => {
      if (!hasAudit && !isCancelled) {
        listenForAudit();
      }
    });

    return () => {
      isCancelled = true;
      if (eventSource) eventSource.close();
    };
  }, [clientId]);

  const getTrendInfo = (
    metric: string,
    reverse = false,
    tooltipMessage?: string
  ) => {
    const value = latest?.[metric] ?? 0;
    const prev = previous?.[metric] ?? 0;
    const { delta, direction } = getTrend(value, prev);

    const realDirection = reverse
      ? direction === 'up'
        ? 'down'
        : direction === 'down'
          ? 'up'
          : 'neutral'
      : direction;

    const badgeContent = realDirection !== 'neutral' && (
      <Badge
        variant='outline'
        className={
          realDirection === 'up'
            ? 'text-green-600'
            : realDirection === 'down'
              ? 'text-red-600'
              : ''
        }
      >
        {realDirection === 'up' ? (
          <IconTrendingUp className='mr-1 h-4 w-4' />
        ) : (
          <IconTrendingDown className='mr-1 h-4 w-4' />
        )}
        {delta > 0 ? `+${delta}%` : `${delta}%`}
      </Badge>
    );

    const badge = tooltipMessage ? (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
          <TooltipContent>{tooltipMessage}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ) : (
      badgeContent
    );

    return { badge, direction: realDirection };
  };

  const { badge: trend200, direction: dir200 } =
    getTrendInfo('pages_200_response');
  const { badge: trend3xx, direction: dir3xx } = getTrendInfo(
    'pages_3xx_response',
    true,
    'Increase in 3xx redirects may indicate redirect chains or misconfigurations.'
  );
  const { badge: trend4xx, direction: dir4xx } = getTrendInfo(
    'pages_4xx_response',
    true
  );
  const { badge: trendScore, direction: dirScore } = getTrendInfo('score');

  return (
    <PageContainer>
      {!latest ? (
        <div className='flex min-h-[60vh] flex-1 flex-col items-center justify-center space-y-4'>
          <CrawlLoadingSpinner />
        </div>
      ) : (
        <div className='flex flex-1 flex-col space-y-2'>
          <div className='flex items-center justify-between'>
            <h1 className='text-2xl font-bold'>{`${client?.name} Overview`}</h1>
            {client && (
              <ReCrawlButton clientId={String(client.id)} url={client.url} />
            )}
          </div>

          <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
            <Card className='@container/card'>
              <CardHeader>
                <CardDescription>Pages Crawled</CardDescription>
                <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                  {latest?.pages_200_response || 0}
                </CardTitle>
                <CardAction>{trend200}</CardAction>
              </CardHeader>
              <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                <div className='line-clamp-1 flex gap-2 font-medium'>
                  {dir200 === 'up'
                    ? 'Trending up'
                    : dir200 === 'down'
                      ? 'Trending down'
                      : 'No change'}
                </div>
                <div className='text-muted-foreground'>
                  Successful pages (200 OK)
                </div>
              </CardFooter>
            </Card>

            <Card className='@container/card'>
              <CardHeader>
                <CardDescription>3xx Error Codes</CardDescription>
                <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                  {latest?.pages_3xx_response || 0}
                </CardTitle>
                <CardAction>{trend3xx}</CardAction>
              </CardHeader>
              <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                <div className='line-clamp-1 flex gap-2 font-medium'>
                  {dir3xx === 'up'
                    ? 'Trending up'
                    : dir3xx === 'down'
                      ? 'Trending down'
                      : 'No change'}
                </div>
                <div className='text-muted-foreground'>Error pages (3xx)</div>
              </CardFooter>
            </Card>

            <Card className='@container/card'>
              <CardHeader>
                <CardDescription>4xx Error Codes</CardDescription>
                <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                  {latest?.pages_4xx_response || 0}
                </CardTitle>
                <CardAction>{trend4xx}</CardAction>
              </CardHeader>
              <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                <div className='line-clamp-1 flex gap-2 font-medium'>
                  {dir4xx === 'up'
                    ? 'Trending up'
                    : dir4xx === 'down'
                      ? 'Trending down'
                      : 'No change'}
                </div>
                <div className='text-muted-foreground'>Error pages (4xx)</div>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Audit Score</CardDescription>
                <CardTitle className='text-3xl font-bold tabular-nums'>
                  {latest?.score ?? '—'}
                </CardTitle>
                <CardAction>{trendScore}</CardAction>
              </CardHeader>
              <CardFooter className='text-muted-foreground text-sm'>
                {dirScore === 'up'
                  ? 'Improved since last audit'
                  : dirScore === 'down'
                    ? 'Worsened since last audit'
                    : 'No change from last audit'}
              </CardFooter>
            </Card>
          </div>

          <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
            <div className='col-span-4'>
              <AreaGraphStatusCodes />
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
      )}
    </PageContainer>
  );
}

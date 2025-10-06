// src/app/dashboard/[clientId]/overview/page.tsx
import LiveAuditGate from './LiveAuditGate';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AreaGraphStatusCodes } from '@/features/overview/components/area-graph-status-codes';
import { DoughnutGraph } from '@/features/overview/components/doughnut-graph';
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
import { Heading } from '@/components/ui/heading';
import { getClientOverviewData } from '@/features/overview/lib/get-client-overview-data';
import { ClientHeader } from '@/components/common/client-header';

export default async function ClientOverviewPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const cid = Number(clientId);

  const { client, latest, previous, latestCrawl } =
    await getClientOverviewData(cid);

  const shouldListenForUpdates = !latest || latestCrawl?.state === 'STARTED';

  // --- Helpers for issue deltas & labels ---
  const EXCLUDE_KEYS = new Set([
    'id',
    'clientId',
    'crawlId',
    'createdAt',
    'updatedAt',
    'score',
    'pages_200_response',
    'pages_3xx_response',
    'pages_4xx_response',
    'pages_5xx_response'
  ]);

  type Severity = 'Alert' | 'Warning' | 'Opportunity';
  const getSeverity = (k: string): Severity => {
    if (/5xx|4xx|missing_(title|description|h1|h2)/.test(k)) return 'Alert';
    if (
      /3xx|multiple_(title|description|h1)|with_multiple_h2s|duplicate_(title|description|h1|h2)/.test(
        k
      )
    )
      return 'Warning';
    if (/too_short_|too_long_|under_|over_/.test(k)) return 'Opportunity';
    return 'Warning';
  };

  const prettyIssue = (k: string) =>
    k
      .replace(/^pages_/, '')
      .replace(/_/g, ' ')
      .replace(/\bwith\b\s*/i, '')
      .replace(/\bh1\b/gi, 'H1')
      .replace(/\bh2\b/gi, 'H2')
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const computeIssueDeltas = (
    latestObj: Record<string, any>,
    prevObj: Record<string, any>
  ) => {
    const entries: {
      key: string;
      latest: number;
      prev: number;
      delta: number;
      severity: Severity;
    }[] = [];
    if (!latestObj) return entries;
    for (const [k, v] of Object.entries(latestObj)) {
      if (EXCLUDE_KEYS.has(k)) continue;
      if (typeof v !== 'number') continue;
      const prev = typeof prevObj?.[k] === 'number' ? prevObj[k] : 0;
      const delta = v - prev;
      entries.push({
        key: k,
        latest: v,
        prev,
        delta,
        severity: getSeverity(k)
      });
    }
    return entries;
  };

  const issueDeltas = computeIssueDeltas(latest || {}, previous || {});
  const TOP_LIMIT = 5;
  const topTrendingUp = issueDeltas
    .filter((e) => e.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, TOP_LIMIT);
  const topTrendingDown = issueDeltas
    .filter((e) => e.delta < 0)
    .sort((a, b) => a.delta - b.delta)
    .slice(0, TOP_LIMIT);

  type TrendMetric =
    | 'pages_200_response'
    | 'pages_3xx_response'
    | 'pages_4xx_response'
    | 'score';

  const getTrendInfo = (
    metric: TrendMetric,
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

  const lastCrawlClean = latest?.createdAt
    ? new Date(latest.createdAt).toLocaleString()
    : 'N/A';

  return (
    <PageContainer>
      {/* Auto-refresh the page when a newer audit arrives (SSE + polling fallback) */}
      <LiveAuditGate
        clientId={cid}
        initialLatestId={latest?.id ?? null}
        enabled={shouldListenForUpdates}
      />

      {!latest ? (
        <div className='flex min-h-[60vh] flex-1 flex-col items-center justify-center space-y-4'>
          <CrawlLoadingSpinner />
          <p className='text-muted-foreground'>
            Awaiting first crawl to complete...
          </p>
        </div>
      ) : (
        <div className='flex flex-1 flex-col space-y-2'>
          <div className='flex items-center justify-between'>
            <Heading
              title={`${client?.name} Overview`}
              description={`Last Crawl: ${lastCrawlClean}`}
            />
            <div className='flex items-center gap-2'>
              <ClientHeader clientId={cid} />
              {client && client.url && (
                <ReCrawlButton clientId={String(client.id)} url={client.url} />
              )}
            </div>
          </div>

          {/* ROW 1: Primary visuals */}
          <div className='mb-6 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-7'>
            <div className='col-span-4'>
              <div className='h-full'>
                <AreaGraphStatusCodes />
              </div>
            </div>
            <div className='col-span-3'>
              <div className='h-full'>
                <DoughnutGraph auditScore={latest?.score || 0} />
              </div>
            </div>
          </div>

          {/* ROW 2: KPIs */}
          <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card mb-6 grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
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
                <CardDescription>Redirects (3xx)</CardDescription>
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
                <div className='text-muted-foreground'>
                  Redirects and chains (3xx)
                </div>
              </CardFooter>
            </Card>

            <Card className='@container/card'>
              <CardHeader>
                <CardDescription>Client Errors (4xx)</CardDescription>
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
                <div className='text-muted-foreground'>Client errors (4xx)</div>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Audit Score</CardDescription>
                <CardTitle className='text-3xl font-bold tabular-nums'>
                  {latest?.score ?? '—'}/100
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

          {/* ROW 3: Trending lists */}
          <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card mb-6 grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-2'>
            <Card className='@container/card'>
              <CardHeader>
                <CardTitle className='mb-2'>Top Trending Issues</CardTitle>
                <CardDescription>Increased since last audit</CardDescription>
              </CardHeader>
              <CardContent>
                {topTrendingUp.length === 0 ? (
                  <div className='text-muted-foreground text-sm'>
                    No increases.
                  </div>
                ) : (
                  <ul className='space-y-2'>
                    {topTrendingUp.map((e) => (
                      <li
                        key={e.key}
                        className='flex items-center justify-between'
                      >
                        <div className='flex items-center gap-2'>
                          <Badge variant='secondary'>{e.severity}</Badge>
                          <span>{prettyIssue(e.key)}</span>
                        </div>
                        <div className='flex items-center gap-1 font-medium'>
                          <IconTrendingUp className='h-4 w-4' />
                          <span>+{e.delta}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className='@container/card'>
              <CardHeader>
                <CardTitle className='mb-2'>Top Falling Issues</CardTitle>
                <CardDescription>Decreased since last audit</CardDescription>
              </CardHeader>
              <CardContent>
                {topTrendingDown.length === 0 ? (
                  <div className='text-muted-foreground text-sm'>
                    No decreases.
                  </div>
                ) : (
                  <ul className='space-y-2'>
                    {topTrendingDown.map((e) => (
                      <li
                        key={e.key}
                        className='flex items-center justify-between'
                      >
                        <div className='flex items-center gap-2'>
                          <Badge variant='secondary'>{e.severity}</Badge>
                          <span>{prettyIssue(e.key)}</span>
                        </div>
                        <div className='flex items-center gap-1 font-medium'>
                          <IconTrendingDown className='h-4 w-4' />
                          <span>{e.delta}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <Card className='@container/card'>
              <CardHeader>
                <CardTitle className='mb-2'>Top Trending Issues</CardTitle>
                <CardDescription>Increased since last audit</CardDescription>
              </CardHeader>
              <CardContent>
                {topTrendingUp.length === 0 ? (
                  <div className='text-muted-foreground text-sm'>
                    No increases.
                  </div>
                ) : (
                  <ul className='space-y-2'>
                    {topTrendingUp.map((e) => (
                      <li
                        key={e.key}
                        className='flex items-center justify-between'
                      >
                        <div className='flex items-center gap-2'>
                          <Badge variant='secondary'>{e.severity}</Badge>
                          <span>{prettyIssue(e.key)}</span>
                        </div>
                        <div className='flex items-center gap-1 font-medium'>
                          <IconTrendingUp className='h-4 w-4' />
                          <span>+{e.delta}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className='@container/card'>
              <CardHeader>
                <CardTitle className='mb-2'>Top Falling Issues</CardTitle>
                <CardDescription>Decreased since last audit</CardDescription>
              </CardHeader>
              <CardContent>
                {topTrendingDown.length === 0 ? (
                  <div className='text-muted-foreground text-sm'>
                    No decreases.
                  </div>
                ) : (
                  <ul className='space-y-2'>
                    {topTrendingDown.map((e) => (
                      <li
                        key={e.key}
                        className='flex items-center justify-between'
                      >
                        <div className='flex items-center gap-2'>
                          <Badge variant='secondary'>{e.severity}</Badge>
                          <span>{prettyIssue(e.key)}</span>
                        </div>
                        <div className='flex items-center gap-1 font-medium'>
                          <IconTrendingDown className='h-4 w-4' />
                          <span>{e.delta}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

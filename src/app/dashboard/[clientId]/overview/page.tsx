// src/app/dashboard/[clientId]/overview/page.tsx
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { ClientRole } from '@prisma/client';
import LiveAuditGate from './LiveAuditGate';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardContent
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DoughnutGraph } from '@/features/overview/components/doughnut-graph';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconAlertTriangle,
  IconCircleCheck,
  IconArrowUpRight
} from '@tabler/icons-react';
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
import { Button } from '@/components/ui/button';
import { getClientOverviewData } from '@/features/overview/lib/get-client-overview-data';
import { ClientHeader } from '@/components/common/client-header';
import { ensureClientAccess } from '@/lib/auth/memberships';
import { AuditProgressChart } from '@/features/overview/components/audit-progress-chart';

export default async function ClientOverviewPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect('/auth/sign-in');
  }

  const cid = Number(clientId);
  if (!Number.isFinite(cid)) {
    notFound();
  }

  const [membership, overview] = await Promise.all([
    ensureClientAccess(userId, cid),
    getClientOverviewData(cid)
  ]);

  if (!membership) {
    notFound();
  }

  const { client, latest, previous, latestCrawl } = overview;

  const AGENCY_ROLES = new Set<ClientRole>([
    ClientRole.INTERNAL_ADMIN,
    ClientRole.AGENCY_ADMIN,
    ClientRole.AGENCY_ANALYST
  ]);
  const isAgencyUser = AGENCY_ROLES.has(membership.role);

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

  const severityTotals: Record<Severity, number> = {
    Alert: 0,
    Warning: 0,
    Opportunity: 0
  };
  for (const entry of issueDeltas) {
    severityTotals[entry.severity] += entry.latest ?? 0;
  }

  const totalOpenIssues = Object.values(severityTotals).reduce(
    (acc, count) => acc + count,
    0
  );

  const resolvedIssuesCount = issueDeltas
    .filter((entry) => entry.delta < 0)
    .reduce((acc, entry) => acc + Math.abs(entry.delta), 0);

  const newIssuesCount = issueDeltas
    .filter((entry) => entry.delta > 0)
    .reduce((acc, entry) => acc + entry.delta, 0);

  type TrendMetric =
    | 'pages_200_response'
    | 'pages_3xx_response'
    | 'pages_4xx_response'
    | 'pages_5xx_response'
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

  const { badge: trendScore } = getTrendInfo('score');
  const { badge: trend200 } = getTrendInfo('pages_200_response');
  const { badge: trend3xx } = getTrendInfo(
    'pages_3xx_response',
    true,
    'Increase in 3xx redirects may indicate redirect chains or misconfigurations.'
  );
  const { badge: trend4xx } = getTrendInfo('pages_4xx_response', true);
  const { badge: trend5xx } = getTrendInfo('pages_5xx_response', true);

  const lastAuditAt = latest?.createdAt
    ? new Date(latest.createdAt).toLocaleString()
    : 'N/A';

  const latestCrawlAt = latestCrawl?.createdAt
    ? new Date(latestCrawl.createdAt).toLocaleString()
    : null;

  const latestCrawlStateLabel = latestCrawl?.state
    ? latestCrawl.state === 'STARTED'
      ? 'In progress'
      : latestCrawl.state === 'COMPLETED'
        ? 'Completed'
        : 'Aborted'
    : 'Not started';

  const crawlStatusBadgeClass =
    latestCrawl?.state === 'COMPLETED'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 border-transparent'
      : latestCrawl?.state === 'STARTED'
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border-transparent'
        : latestCrawl?.state === 'ABORTED'
          ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300 border-transparent'
          : '';

  const severityStyles: Record<Severity, string> = {
    Alert: 'text-red-600 dark:text-red-400',
    Warning: 'text-amber-600 dark:text-amber-400',
    Opportunity: 'text-sky-600 dark:text-sky-400'
  };

  const quickLinks = [
    {
      label: 'Audit comparison',
      description: 'Review changes between crawls',
      href: `/dashboard/${cid}/audits`
    },
    {
      label: 'URL inventory',
      description: 'Inspect crawled pages and filters',
      href: `/dashboard/${cid}/urls`
    },
    {
      label: 'Client settings',
      description: 'Manage domains, members and integrations',
      href: `/dashboard/${cid}/settings`
    }
  ];

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
        <div className='flex flex-1 flex-col gap-8'>
          <div className='flex flex-wrap items-start justify-between gap-4'>
            <div className='space-y-2'>
              <Heading
                title={client?.name ?? 'Client overview'}
                description={client?.url ?? 'Website URL not set'}
              />
              <p className='text-muted-foreground text-sm'>
                Last audit: {lastAuditAt}
              </p>
              {latestCrawl?.state && latestCrawlAt && (
                <p className='text-muted-foreground text-xs'>
                  Latest crawl {latestCrawlStateLabel.toLowerCase()} ·{' '}
                  {latestCrawlAt}
                </p>
              )}
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              {isAgencyUser && (
                <Badge variant='outline' className='tracking-wide uppercase'>
                  Agency access
                </Badge>
              )}
            </div>
          </div>

          <section>
            <div className='grid gap-4 md:grid-cols-5'>
              <div className='col-span-2 flex flex-col gap-3'>
                <DoughnutGraph auditScore={latest?.score ?? 0} />
              </div>
              <div className='col-span-3'>
                <AuditProgressChart />
              </div>
            </div>
          </section>

          <section>
            <h2 className='text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase'>
              Snapshot
            </h2>
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
              <Card>
                <CardHeader>
                  <CardDescription>Unresolved issues</CardDescription>
                  <CardTitle className='text-3xl font-semibold tabular-nums'>
                    {totalOpenIssues}
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4 text-sm'>
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <span
                        className={`${severityStyles.Alert} flex items-center gap-2 font-medium`}
                      >
                        <IconAlertTriangle className='h-4 w-4' /> Critical
                      </span>
                      <span className='font-medium'>
                        {severityTotals.Alert}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span
                        className={`${severityStyles.Warning} flex items-center gap-2 font-medium`}
                      >
                        <IconAlertTriangle className='h-4 w-4' /> Warning
                      </span>
                      <span className='font-medium'>
                        {severityTotals.Warning}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span
                        className={`${severityStyles.Opportunity} flex items-center gap-2 font-medium`}
                      >
                        <IconCircleCheck className='h-4 w-4' /> Opportunity
                      </span>
                      <span className='font-medium'>
                        {severityTotals.Opportunity}
                      </span>
                    </div>
                  </div>
                  <p className='text-muted-foreground text-xs'>
                    Totals represent pages still impacted in the latest crawl.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardDescription>Since last audit</CardDescription>
                  <CardTitle className='text-xl font-semibold'>
                    Progress snapshot
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4 text-sm'>
                  <div className='flex items-center justify-between rounded-md border border-green-100 bg-green-50 px-3 py-2 text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300'>
                    <span className='flex items-center gap-2 font-medium'>
                      <IconCircleCheck className='h-4 w-4' /> Resolved
                    </span>
                    <span className='text-2xl font-semibold tabular-nums'>
                      {resolvedIssuesCount}
                    </span>
                  </div>
                  <div className='flex items-center justify-between rounded-md border border-red-100 bg-red-50 px-3 py-2 text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300'>
                    <span className='flex items-center gap-2 font-medium'>
                      <IconAlertTriangle className='h-4 w-4' /> New issues
                    </span>
                    <span className='text-2xl font-semibold tabular-nums'>
                      {newIssuesCount}
                    </span>
                  </div>
                  <p className='text-muted-foreground text-xs'>
                    Keep resolving issues faster than new ones appear to sustain
                    positive momentum.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardDescription>Since last audit</CardDescription>
                  <CardTitle className='text-xl font-semibold'>
                    Status Code Trends
                  </CardTitle>
                </CardHeader>
                <CardContent className='grid gap-3 sm:grid-cols-2'>
                  <div className='bg-muted/40 rounded-md border p-3'>
                    <p className='text-muted-foreground text-xs tracking-wide uppercase'>
                      2xx success
                    </p>
                    <div className='mt-1 flex items-baseline justify-between'>
                      <span className='text-3xl font-semibold tabular-nums'>
                        {latest?.pages_200_response ?? 0}
                      </span>
                      <span className='text-xs'>{trend200 || '–'}</span>
                    </div>
                  </div>
                  <div className='bg-muted/40 rounded-md border p-3'>
                    <p className='text-muted-foreground text-xs tracking-wide uppercase'>
                      3xx redirects
                    </p>
                    <div className='mt-1 flex items-baseline justify-between'>
                      <span className='text-3xl font-semibold tabular-nums'>
                        {latest?.pages_3xx_response ?? 0}
                      </span>
                      <span className='text-xs'>{trend3xx || '–'}</span>
                    </div>
                  </div>
                  <div className='bg-muted/40 rounded-md border p-3'>
                    <p className='text-muted-foreground text-xs tracking-wide uppercase'>
                      4xx client errors
                    </p>
                    <div className='mt-1 flex items-baseline justify-between'>
                      <span className='text-3xl font-semibold tabular-nums'>
                        {latest?.pages_4xx_response ?? 0}
                      </span>
                      <span className='text-xs'>{trend4xx || '–'}</span>
                    </div>
                  </div>
                  <div className='bg-muted/40 rounded-md border p-3'>
                    <p className='text-muted-foreground text-xs tracking-wide uppercase'>
                      5xx server errors
                    </p>
                    <div className='mt-1 flex items-baseline justify-between'>
                      <span className='text-3xl font-semibold tabular-nums'>
                        {latest?.pages_5xx_response ?? 0}
                      </span>
                      <span className='text-xs'>{trend5xx || '–'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section>
            <h2 className='text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase'>
              Issue highlights
            </h2>
            <div className='grid gap-4 md:grid-cols-2'>
              <Card className='@container/card'>
                <CardHeader>
                  <CardTitle className='mb-2'>Rising issues</CardTitle>
                  <CardDescription>
                    {newIssuesCount > 0
                      ? `${newIssuesCount} new issues since last audit`
                      : 'No new issues detected'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {topTrendingUp.length === 0 ? (
                    <div className='text-muted-foreground text-sm'>
                      No increases.
                    </div>
                  ) : (
                    <ul className='space-y-2'>
                      {topTrendingUp.map((e) => (
                        <li key={e.key}>
                          <Link
                            href={`/dashboard/${cid}/audits/issues/${e.key.replace(/_/g, '-')}`}
                            className='hover:border-border hover:bg-muted/40 flex items-center justify-between rounded-md border border-transparent px-3 py-2 transition-colors'
                          >
                            <div className='flex items-center gap-2'>
                              <Badge variant='secondary'>{e.severity}</Badge>
                              <span className='font-medium'>
                                {prettyIssue(e.key)}
                              </span>
                            </div>
                            <div className='flex items-center gap-1 font-medium'>
                              <IconTrendingUp className='h-4 w-4' />
                              <span>+{e.delta}</span>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card className='@container/card'>
                <CardHeader>
                  <CardTitle className='mb-2'>Resolved wins</CardTitle>
                  <CardDescription>
                    {resolvedIssuesCount > 0
                      ? `${resolvedIssuesCount} pages improved since last audit`
                      : 'No changes detected'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {topTrendingDown.length === 0 ? (
                    <div className='text-muted-foreground text-sm'>
                      No decreases.
                    </div>
                  ) : (
                    <ul className='space-y-2'>
                      {topTrendingDown.map((e) => (
                        <li key={e.key}>
                          <Link
                            href={`/dashboard/${cid}/audits/issues/${e.key.replace(/_/g, '-')}`}
                            className='hover:border-border hover:bg-muted/40 flex items-center justify-between rounded-md border border-transparent px-3 py-2 transition-colors'
                          >
                            <div className='flex items-center gap-2'>
                              <Badge variant='secondary'>{e.severity}</Badge>
                              <span className='font-medium'>
                                {prettyIssue(e.key)}
                              </span>
                            </div>
                            <div className='flex items-center gap-1 font-medium'>
                              <IconTrendingDown className='h-4 w-4' />
                              <span>{e.delta}</span>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>

          {isAgencyUser && (
            <section className='mb-6 space-y-3'>
              <h2 className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                Agency tools
              </h2>
              <div className='grid gap-4 lg:grid-cols-3'>
                <Card>
                  <CardHeader>
                    <CardTitle>Latest crawl</CardTitle>
                    <CardDescription>Monitor crawl operations</CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-3 text-sm'>
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground'>Status</span>
                      <Badge
                        variant='outline'
                        className={`capitalize ${crawlStatusBadgeClass}`.trim()}
                      >
                        {latestCrawlStateLabel}
                      </Badge>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground'>Started</span>
                      <span className='font-medium'>
                        {latestCrawlAt ?? 'Not available'}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground'>Crawl ID</span>
                      <span className='font-mono text-xs'>
                        {latestCrawl?.id ?? '—'}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className='flex flex-wrap gap-2'>
                    {client?.url && (
                      <ReCrawlButton
                        clientId={String(client.id)}
                        url={client.url}
                      />
                    )}
                    <Button variant='outline' size='sm' asChild>
                      <Link href={`/dashboard/${cid}/audits`}>
                        View audit timeline
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick links</CardTitle>
                    <CardDescription>Jump into deeper analysis</CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-2 text-sm'>
                    <ul className='space-y-2'>
                      {quickLinks.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            className='hover:border-border hover:bg-muted/40 flex items-center justify-between rounded-md border border-transparent px-3 py-2 transition-colors'
                          >
                            <div>
                              <p className='font-medium'>{link.label}</p>
                              <p className='text-muted-foreground text-xs'>
                                {link.description}
                              </p>
                            </div>
                            <IconArrowUpRight className='text-muted-foreground h-4 w-4' />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Collaboration</CardTitle>
                    <CardDescription>
                      Manage access and share progress updates
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='text-muted-foreground text-sm'>
                    Invite teammates to review audits or assign follow-up
                    actions directly from Atlas.
                  </CardContent>
                  <CardFooter>
                    <ClientHeader clientId={cid} showInvite={isAgencyUser} />
                  </CardFooter>
                </Card>
              </div>
            </section>
          )}
        </div>
      )}
    </PageContainer>
  );
}

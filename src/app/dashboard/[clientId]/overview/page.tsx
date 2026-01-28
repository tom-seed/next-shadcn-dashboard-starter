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
import { Progress } from '@/components/ui/progress';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconArrowUpRight,
  IconAlertCircle
} from '@tabler/icons-react';
import PageContainer from '@/components/layout/page-container';
import { getTrend } from '@/lib/helpers/getTrend';
import { CrawlLoadingSpinner } from '@/components/ui/crawl-loading-spinner';
import ReCrawlButton from '@/features/overview/components/re-crawl-button';
import { Heading } from '@/components/ui/heading';
import { Button } from '@/components/ui/button';
import { getClientOverviewData } from '@/features/overview/lib/get-client-overview-data';
import { ClientHeader } from '@/components/common/client-header';
import { ensureClientAccess } from '@/lib/auth/memberships';
import { AuditProgressChart } from '@/features/overview/components/audit-progress-chart';
import { AreaGraphStatusCodes } from '@/features/overview/components/area-graph-status-codes';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

  const crawlAbortedWithoutAudit =
    latestCrawl?.state === 'ABORTED' &&
    (!latest || (latest && latestCrawl.id !== latest.crawlId));

  const displayAudit = crawlAbortedWithoutAudit && previous ? previous : latest;
  const comparisonAudit =
    crawlAbortedWithoutAudit && previous ? latest : previous;

  const shouldListenForUpdates =
    (!latest && !previous) || latestCrawl?.state === 'STARTED';

  // --- Issue delta computation ---
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
    'pages_5xx_response',
    'pages_301_permanent',
    'pages_302_temporary',
    'pages_303_see_other',
    'pages_307_temporary',
    'pages_308_permanent',
    'pages_3xx_other',
    'pages_401_unauthorized',
    'pages_403_forbidden',
    'pages_404_not_found',
    'pages_405_method_not_allowed',
    'pages_408_timeout',
    'pages_410_gone',
    'pages_429_rate_limited',
    'pages_4xx_other',
    'pages_500_internal_error',
    'pages_502_bad_gateway',
    'pages_503_unavailable',
    'pages_504_timeout',
    'pages_5xx_other',
    'total_images',
    'pages_with_images_missing_alt',
    'pages_with_images_empty_alt',
    'pages_with_images_missing_dimensions',
    'pages_with_unoptimized_image_format',
    'total_images_missing_alt',
    'total_images_empty_alt',
    'total_images_missing_dimensions',
    'total_images_unoptimized_format'
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

  const issueDeltas = computeIssueDeltas(
    displayAudit || {},
    comparisonAudit || {}
  );
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

  const resolvedIssuesCount = issueDeltas
    .filter((entry) => entry.delta < 0)
    .reduce((acc, entry) => acc + Math.abs(entry.delta), 0);

  const newIssuesCount = issueDeltas
    .filter((entry) => entry.delta > 0)
    .reduce((acc, entry) => acc + entry.delta, 0);

  const totalPages =
    (displayAudit?.pages_200_response ?? 0) +
    (displayAudit?.pages_3xx_response ?? 0) +
    (displayAudit?.pages_4xx_response ?? 0) +
    (displayAudit?.pages_5xx_response ?? 0);

  const netChange = resolvedIssuesCount - newIssuesCount;

  // Score trend
  const scoreValue = displayAudit?.score ?? 0;
  const scorePrev = comparisonAudit?.score ?? 0;
  const scoreTrend = getTrend(scoreValue, scorePrev);

  const lastAuditAt = displayAudit?.createdAt
    ? new Date(displayAudit.createdAt).toLocaleString()
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

  // Score colour helpers
  const scoreColor =
    scoreValue >= 80
      ? 'text-emerald-600 dark:text-emerald-400'
      : scoreValue >= 60
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400';
  const scoreBarColor =
    scoreValue >= 80
      ? '[&_[data-slot=progress-indicator]]:bg-emerald-500'
      : scoreValue >= 60
        ? '[&_[data-slot=progress-indicator]]:bg-amber-500'
        : '[&_[data-slot=progress-indicator]]:bg-red-500';

  // Severity breakdown
  const totalIssues =
    severityTotals.Alert + severityTotals.Warning + severityTotals.Opportunity;
  const severityCards: {
    label: string;
    count: number;
    color: string;
    barColor: string;
  }[] = [
    {
      label: 'Critical',
      count: severityTotals.Alert,
      color: 'text-red-600 dark:text-red-400',
      barColor: '[&_[data-slot=progress-indicator]]:bg-red-500'
    },
    {
      label: 'Warnings',
      count: severityTotals.Warning,
      color: 'text-amber-600 dark:text-amber-400',
      barColor: '[&_[data-slot=progress-indicator]]:bg-amber-500'
    },
    {
      label: 'Opportunities',
      count: severityTotals.Opportunity,
      color: 'text-sky-600 dark:text-sky-400',
      barColor: '[&_[data-slot=progress-indicator]]:bg-sky-500'
    }
  ];

  return (
    <PageContainer>
      <LiveAuditGate
        clientId={cid}
        initialLatestId={latest?.id ?? null}
        enabled={shouldListenForUpdates}
      />

      {!displayAudit ? (
        <div className='flex min-h-[60vh] flex-1 flex-col items-center justify-center space-y-4'>
          <CrawlLoadingSpinner />
        </div>
      ) : (
        <div className='flex flex-1 flex-col gap-6'>
          {/* Alert banner */}
          {crawlAbortedWithoutAudit && (
            <Alert variant='destructive'>
              <IconAlertCircle className='h-4 w-4' />
              <AlertTitle>Crawl Failed</AlertTitle>
              <AlertDescription>
                The latest crawl was aborted and unable to complete audit.
                Showing results from the previous successful audit instead.
                {latestCrawlAt && (
                  <span className='mt-1 block text-xs'>
                    Failed crawl started: {latestCrawlAt}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* A. Header */}
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div className='flex items-center gap-3'>
              <Heading
                title={client?.name ?? 'Client overview'}
                description={client?.url ?? 'Website URL not set'}
              />
              <Badge
                variant='outline'
                className={`text-xs ${crawlStatusBadgeClass}`.trim()}
              >
                {latestCrawlStateLabel}
              </Badge>
            </div>
            <p className='text-muted-foreground text-xs'>
              Last audit: {lastAuditAt}
            </p>
          </div>

          {/* B. Score banner */}
          <Card>
            <CardContent className='flex flex-col gap-6 py-5 md:flex-row md:items-center'>
              {/* Score */}
              <div className='flex min-w-[160px] flex-col gap-2'>
                <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                  Audit Score
                </p>
                <div className='flex items-baseline gap-2'>
                  <span
                    className={`text-4xl font-bold tabular-nums ${scoreColor}`}
                  >
                    {scoreValue}
                  </span>
                  <span className='text-muted-foreground text-sm'>/ 100</span>
                  {scoreTrend.direction !== 'neutral' && (
                    <Badge
                      variant='outline'
                      className={
                        scoreTrend.direction === 'up'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      {scoreTrend.direction === 'up' ? (
                        <IconTrendingUp className='mr-1 h-3 w-3' />
                      ) : (
                        <IconTrendingDown className='mr-1 h-3 w-3' />
                      )}
                      {scoreTrend.delta > 0
                        ? `+${scoreTrend.delta}%`
                        : `${scoreTrend.delta}%`}
                    </Badge>
                  )}
                </div>
                <Progress
                  value={scoreValue}
                  className={`h-2 ${scoreBarColor}`}
                />
              </div>

              {/* Divider */}
              <div className='bg-border hidden h-12 w-px md:block' />

              {/* Inline metrics */}
              <div className='flex flex-1 flex-wrap gap-6 md:gap-10'>
                <div className='flex flex-col'>
                  <span className='text-2xl font-bold tabular-nums'>
                    {totalPages}
                  </span>
                  <span className='text-muted-foreground text-xs'>
                    Total Pages
                  </span>
                </div>
                <div className='flex flex-col'>
                  <span className='text-2xl font-bold text-red-600 tabular-nums dark:text-red-400'>
                    {severityTotals.Alert}
                  </span>
                  <span className='text-muted-foreground text-xs'>
                    Critical Issues
                  </span>
                </div>
                <div className='flex flex-col'>
                  <span
                    className={`text-2xl font-bold tabular-nums ${netChange > 0 ? 'text-green-600' : netChange < 0 ? 'text-red-600' : ''}`}
                  >
                    {netChange > 0 ? `+${netChange}` : netChange}
                  </span>
                  <span className='text-muted-foreground text-xs'>
                    Net Change
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* C. Two charts side by side */}
          <div className='grid gap-4 md:grid-cols-2'>
            <AuditProgressChart />
            <AreaGraphStatusCodes />
          </div>

          {/* D. Issue severity breakdown */}
          <div className='grid gap-4 md:grid-cols-3'>
            {severityCards.map((s) => {
              const pct =
                totalIssues > 0 ? Math.round((s.count / totalIssues) * 100) : 0;
              return (
                <Card key={s.label}>
                  <CardContent className='flex flex-col gap-2 py-4'>
                    <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                      {s.label}
                    </p>
                    <div className='flex items-baseline gap-2'>
                      <span
                        className={`text-2xl font-bold tabular-nums ${s.color}`}
                      >
                        {s.count}
                      </span>
                      <span className='text-muted-foreground text-xs'>
                        {pct}%
                      </span>
                    </div>
                    <Progress value={pct} className={`h-1.5 ${s.barColor}`} />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* E. Action items */}
          <div className='grid gap-4 md:grid-cols-2'>
            <Card>
              <CardHeader>
                <CardTitle>Rising issues</CardTitle>
                <CardDescription>
                  {newIssuesCount > 0
                    ? `${newIssuesCount} new issues since last audit`
                    : 'No new issues detected'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topTrendingUp.length === 0 ? (
                  <p className='text-muted-foreground text-sm'>No increases.</p>
                ) : (
                  <ul className='space-y-1'>
                    {topTrendingUp.map((e) => (
                      <li key={e.key}>
                        <Link
                          href={`/dashboard/${cid}/audits/issues/${e.key.replace(/_/g, '-')}`}
                          className='hover:bg-muted/50 flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors'
                        >
                          <div className='flex items-center gap-2'>
                            <Badge variant='secondary' className='text-xs'>
                              {e.severity}
                            </Badge>
                            <span className='font-medium'>
                              {prettyIssue(e.key)}
                            </span>
                          </div>
                          <span className='flex items-center gap-1 font-medium text-red-600'>
                            <IconTrendingUp className='h-3.5 w-3.5' />+{e.delta}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resolved wins</CardTitle>
                <CardDescription>
                  {resolvedIssuesCount > 0
                    ? `${resolvedIssuesCount} pages improved since last audit`
                    : 'No changes detected'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topTrendingDown.length === 0 ? (
                  <p className='text-muted-foreground text-sm'>No decreases.</p>
                ) : (
                  <ul className='space-y-1'>
                    {topTrendingDown.map((e) => (
                      <li key={e.key}>
                        <Link
                          href={`/dashboard/${cid}/audits/issues/${e.key.replace(/_/g, '-')}`}
                          className='hover:bg-muted/50 flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors'
                        >
                          <div className='flex items-center gap-2'>
                            <Badge variant='secondary' className='text-xs'>
                              {e.severity}
                            </Badge>
                            <span className='font-medium'>
                              {prettyIssue(e.key)}
                            </span>
                          </div>
                          <span className='flex items-center gap-1 font-medium text-green-600'>
                            <IconTrendingDown className='h-3.5 w-3.5' />
                            {e.delta}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {/* F. Agency tools */}
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
                            className='hover:bg-muted/50 flex items-center justify-between rounded-md px-3 py-2 transition-colors'
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

// src/app/dashboard/[clientId]/overview/page.tsx
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import LiveAuditGate from './LiveAuditGate';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import PageContainer from '@/components/layout/page-container';
import { CrawlLoadingSpinner } from '@/components/ui/crawl-loading-spinner';
import { Heading } from '@/components/ui/heading';
import { Button } from '@/components/ui/button';
import { getClientOverviewData } from '@/features/overview/lib/get-client-overview-data';
import { ensureClientAccess } from '@/lib/auth/memberships';
import { AuditProgressChart } from '@/features/overview/components/audit-progress-chart';
import { AreaGraphStatusCodes } from '@/features/overview/components/area-graph-status-codes';
import { DoughnutGraph } from '@/features/overview/components/doughnut-graph';
import { Separator } from '@/components/ui/separator';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconPhoto,
  IconFileText
} from '@tabler/icons-react';

const getStatusColor = (value: number): string => {
  if (value === 0) return 'bg-emerald-500';
  if (value <= 5) return 'bg-amber-500';
  return 'bg-red-500';
};

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

  const scoreValue = displayAudit?.score ?? 0;

  const lastAuditAt = displayAudit?.createdAt
    ? new Date(displayAudit.createdAt).toLocaleString()
    : 'N/A';

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

  // Schema coverage
  const schemaTotal =
    (displayAudit?.pages_with_schema ?? 0) +
    (displayAudit?.pages_missing_schema ?? 0);
  const schemaPct =
    schemaTotal > 0
      ? Math.round(((displayAudit?.pages_with_schema ?? 0) / schemaTotal) * 100)
      : 0;

  // Recommended next steps
  const recommendations: { title: string; description: string }[] = [];
  if (severityTotals.Alert > 0) {
    recommendations.push({
      title: `Fix ${severityTotals.Alert} critical issues affecting your site's search visibility`,
      description:
        'These issues directly affect how search engines see your site.'
    });
  }
  if ((displayAudit?.total_images_missing_alt ?? 0) > 0) {
    recommendations.push({
      title: `Add alt text to ${displayAudit!.total_images_missing_alt} images to improve accessibility and SEO`,
      description:
        'Alt text helps visually impaired users and gives search engines context about your images.'
    });
  }
  if ((displayAudit?.pages_not_in_sitemap ?? 0) > 0) {
    recommendations.push({
      title: `Submit ${displayAudit!.pages_not_in_sitemap} pages to your XML sitemap so search engines can find them`,
      description:
        'Pages missing from your sitemap may not be discovered or indexed promptly.'
    });
  }
  if ((displayAudit?.total_orphaned_pages ?? 0) > 0) {
    recommendations.push({
      title: `Add internal links to ${displayAudit!.total_orphaned_pages} orphaned pages so visitors and search engines can reach them`,
      description:
        'Orphaned pages have no internal links pointing to them, making them hard to find.'
    });
  }
  if ((displayAudit?.pages_thin_content ?? 0) > 0) {
    recommendations.push({
      title: `Expand content on ${displayAudit!.pages_thin_content} thin pages to provide more value to visitors`,
      description:
        'Thin pages may not rank well and offer little value to your audience.'
    });
  }
  if ((displayAudit?.pages_exact_duplicate_content ?? 0) > 0) {
    recommendations.push({
      title: `Consolidate ${displayAudit!.pages_exact_duplicate_content} duplicate pages to avoid confusing search engines`,
      description:
        'Duplicate content splits ranking signals and can lead to the wrong page appearing in search results.'
    });
  }
  if ((displayAudit?.pages_slow_response ?? 0) > 0) {
    recommendations.push({
      title: `Improve load times on ${displayAudit!.pages_slow_response} slow pages to reduce visitor drop-off`,
      description:
        'Slow pages frustrate visitors and can hurt your search rankings.'
    });
  }
  const topRecommendations = recommendations.slice(0, 4);

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
        <div className='mb-12 flex flex-1 flex-col gap-8'>
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

          {/* B. Vitals Row */}
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            {/* 1. Score */}
            <Card className='flex flex-col'>
              <CardHeader className='pb-2'>
                <CardTitle className='text-muted-foreground text-sm font-medium tracking-wide uppercase'>
                  Audit Score
                </CardTitle>
              </CardHeader>
              <CardContent className='flex flex-1 items-center justify-center pb-6'>
                <DoughnutGraph auditScore={scoreValue} />
              </CardContent>
            </Card>

            {/* 2. Total Pages */}
            <Card className='flex flex-col justify-between'>
              <CardHeader className='pb-2'>
                <CardTitle className='text-muted-foreground text-sm font-medium tracking-wide uppercase'>
                  Total Pages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-end justify-between'>
                  <div className='text-4xl font-bold tabular-nums'>
                    {totalPages}
                  </div>
                  <div className='text-muted-foreground mb-1 text-xs'>
                    Discovered URLs
                  </div>
                </div>
                <div className='mt-4 grid grid-cols-2 gap-2 text-xs'>
                  <div className='bg-muted/40 flex flex-col rounded-md p-2'>
                    <span className='text-muted-foreground'>Successful</span>
                    <span className='font-semibold'>
                      {displayAudit?.pages_200_response ?? 0}
                    </span>
                  </div>
                  <div className='bg-muted/40 flex flex-col rounded-md p-2'>
                    <span className='text-muted-foreground'>Redirects</span>
                    <span className='font-semibold'>
                      {displayAudit?.pages_3xx_response ?? 0}
                    </span>
                  </div>
                  <div className='bg-muted/40 flex flex-col rounded-md border-l-2 border-amber-500 p-2'>
                    <span className='text-muted-foreground'>Client Err</span>
                    <span className='font-medium text-amber-500'>
                      {displayAudit?.pages_4xx_response ?? 0}
                    </span>
                  </div>
                  <div className='bg-muted/40 flex flex-col rounded-md border-l-2 border-red-500 p-2'>
                    <span className='text-muted-foreground'>Server Err</span>
                    <span className='font-bold text-red-500'>
                      {displayAudit?.pages_5xx_response ?? 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. Critical Issues */}
            <Card className='flex flex-col justify-between'>
              <CardHeader className='pb-2'>
                <CardTitle className='text-muted-foreground text-sm font-medium tracking-wide uppercase'>
                  Critical Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='mb-4 flex items-end justify-between'>
                  <div className='text-4xl font-bold text-red-600 tabular-nums dark:text-red-400'>
                    {severityTotals.Alert}
                  </div>
                  <span className='rounded-full bg-red-100/50 px-2 py-1 text-xs font-medium text-red-600/80 dark:bg-red-900/20'>
                    Requires Action
                  </span>
                </div>
                <div className='space-y-2'>
                  {issueDeltas
                    .filter((i) => i.severity === 'Alert' && i.latest > 0)
                    .sort((a, b) => b.latest - a.latest)
                    .slice(0, 3)
                    .map((issue) => (
                      <Link
                        key={issue.key}
                        href={`/dashboard/${cid}/audits`}
                        className='hover:bg-muted/50 -mx-1 flex items-center justify-between rounded-md p-1 text-xs transition-colors'
                      >
                        <span
                          className='text-muted-foreground max-w-[160px] truncate'
                          title={prettyIssue(issue.key)}
                        >
                          {prettyIssue(issue.key)}
                        </span>
                        <span className='font-mono font-medium'>
                          {issue.latest}
                        </span>
                      </Link>
                    ))}
                  {issueDeltas.filter(
                    (i) => i.severity === 'Alert' && i.latest > 0
                  ).length === 0 && (
                    <div className='text-muted-foreground text-xs italic'>
                      No critical issues found.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 4. Net Change */}
            <Card className='flex flex-col justify-between'>
              <CardHeader className='pb-2'>
                <CardTitle className='text-muted-foreground text-sm font-medium tracking-wide uppercase'>
                  Net Change
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`flex items-center gap-2 text-4xl font-bold tabular-nums ${netChange > 0 ? 'text-emerald-600' : netChange < 0 ? 'text-red-600' : ''}`}
                >
                  {netChange > 0 ? `+${netChange}` : netChange}
                  {netChange > 0 && <IconTrendingUp className='h-6 w-6' />}
                  {netChange < 0 && <IconTrendingDown className='h-6 w-6' />}
                </div>
                <p className='text-muted-foreground mt-1 text-xs'>
                  Since last audit
                </p>
                <div className='mt-4 flex gap-1'>
                  <Badge
                    variant='outline'
                    className='h-5 px-1 py-0 text-[10px]'
                  >
                    {newIssuesCount > 0 ? `+${newIssuesCount} new` : '0 new'}
                  </Badge>
                  <Badge
                    variant='outline'
                    className='h-5 px-1 py-0 text-[10px]'
                  >
                    {resolvedIssuesCount > 0
                      ? `-${resolvedIssuesCount} resolved`
                      : '0 resolved'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Audit Trends ────────────────────────────── */}
          <div>
            <h3 className='text-lg font-semibold'>Audit Trends</h3>
            <p className='text-muted-foreground mt-1 text-sm'>
              How your site health has changed over time
            </p>
          </div>

          {/* C. History Row — 2/3 + 1/3 */}
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
            <div className='lg:col-span-2'>
              <AuditProgressChart />
            </div>

            {/* Priorities */}
            <Card className='flex flex-col'>
              <CardHeader>
                <CardTitle>Top Priorities</CardTitle>
                <CardDescription>Issues sorted by severity</CardDescription>
              </CardHeader>
              <CardContent className='flex-1'>
                <div className='space-y-4'>
                  {severityCards.map((s) => (
                    <div key={s.label} className='space-y-2'>
                      <div className='flex items-center justify-between text-sm'>
                        <div className='flex items-center gap-2'>
                          <div
                            className={`h-2 w-2 rounded-full ${s.color.split(' ')[0].replace('text-', 'bg-')}`}
                          />
                          <span className='font-medium'>{s.label}</span>
                        </div>
                        <span className='font-bold tabular-nums'>
                          {s.count}
                        </span>
                      </div>
                      <Progress
                        value={
                          totalIssues > 0 ? (s.count / totalIssues) * 100 : 0
                        }
                        className={`h-1.5 ${s.barColor}`}
                      />
                    </div>
                  ))}
                  <Separator className='my-4' />
                  <p className='text-muted-foreground text-center text-xs'>
                    Total Identified Issues:{' '}
                    <span className='text-foreground font-mono'>
                      {totalIssues}
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Response Codes ───────────────────────────── */}
          <div>
            <h3 className='text-lg font-semibold'>Response Codes</h3>
            <p className='text-muted-foreground mt-1 text-sm'>
              HTTP status code distribution across your pages
            </p>
          </div>

          {/* D. Insights Row — 1/2 + 1/2 */}
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
            {/* Col 1: Status Codes */}
            <AreaGraphStatusCodes />

            {/* Col 2: Activity Feed */}
            <Card className='flex flex-col'>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Changes detected in this crawl
                </CardDescription>
              </CardHeader>
              <CardContent className='flex-1 overflow-hidden'>
                <div className='flex h-full flex-col gap-4'>
                  {newIssuesCount === 0 && resolvedIssuesCount === 0 ? (
                    <div className='text-muted-foreground flex flex-1 items-center justify-center text-sm'>
                      No significant changes detected.
                    </div>
                  ) : (
                    <div className='space-y-4'>
                      {topTrendingUp.length > 0 && (
                        <div>
                          <span className='mb-2 block text-xs font-semibold tracking-wider text-red-500 uppercase'>
                            New Issues
                          </span>
                          <ul className='space-y-2'>
                            {topTrendingUp.slice(0, 3).map((e) => (
                              <li
                                key={e.key}
                                className='bg-muted/30 flex items-center justify-between rounded-md p-2 text-sm'
                              >
                                <span className='min-w-0 flex-1 truncate font-medium'>
                                  {prettyIssue(e.key)}
                                </span>
                                <Badge
                                  variant='outline'
                                  className='ml-2 shrink-0 border-red-200 bg-red-50 text-red-500 dark:bg-red-950/20'
                                >
                                  +{e.delta}
                                </Badge>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {topTrendingDown.length > 0 && (
                        <div>
                          <span className='mb-2 block text-xs font-semibold tracking-wider text-emerald-500 uppercase'>
                            Resolved
                          </span>
                          <ul className='space-y-2'>
                            {topTrendingDown.slice(0, 3).map((e) => (
                              <li
                                key={e.key}
                                className='bg-muted/30 flex items-center justify-between rounded-md p-2 text-sm'
                              >
                                <span className='min-w-0 flex-1 truncate font-medium'>
                                  {prettyIssue(e.key)}
                                </span>
                                <Badge
                                  variant='outline'
                                  className='ml-2 shrink-0 border-emerald-200 bg-emerald-50 text-emerald-500 dark:bg-emerald-950/20'
                                >
                                  {e.delta}
                                </Badge>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Site Health ──────────────────────────────── */}
          <div>
            <h3 className='text-lg font-semibold'>Site Health</h3>
            <p className='text-muted-foreground mt-1 text-sm'>
              How search engines access and understand your site
            </p>
          </div>

          {/* E. Site Health — 1/2 + 1/2 */}
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
            {/* Crawlability & Indexing */}
            <Card>
              <CardHeader>
                <CardTitle>Crawlability & Indexing</CardTitle>
                <CardDescription>
                  How well search engines can discover and index your pages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {[
                    {
                      label: 'Blocked by Robots',
                      desc: 'Pages your robots.txt prevents search engines from seeing',
                      value: displayAudit?.pages_blocked_by_robots ?? 0
                    },
                    {
                      label: 'Non-Indexable',
                      desc: 'Pages that search engines cannot add to their index',
                      value: displayAudit?.pages_non_indexable ?? 0
                    },
                    {
                      label: 'Noindex Pages',
                      desc: "Pages you've explicitly told search engines to skip",
                      value: displayAudit?.pages_noindex ?? 0
                    },
                    {
                      label: 'Not in Sitemap',
                      desc: 'Crawled pages missing from your XML sitemap',
                      value: displayAudit?.pages_not_in_sitemap ?? 0
                    },
                    {
                      label: 'Sitemap Errors',
                      desc: 'Sitemap URLs returning errors instead of live pages',
                      value:
                        (displayAudit?.pages_in_sitemap_non_200 ?? 0) +
                        (displayAudit?.pages_in_sitemap_not_crawled ?? 0)
                    },
                    {
                      label: 'Mixed Content',
                      desc: 'HTTPS pages loading insecure HTTP resources',
                      value: displayAudit?.pages_with_mixed_content ?? 0
                    }
                  ].map((item) => (
                    <div
                      key={item.label}
                      className='flex items-start justify-between gap-4'
                    >
                      <div className='min-w-0 flex-1'>
                        <p className='text-sm font-medium'>{item.label}</p>
                        <p className='text-muted-foreground text-xs'>
                          {item.desc}
                        </p>
                      </div>
                      <div className='flex shrink-0 items-center gap-2 pt-0.5'>
                        <div
                          className={`h-2 w-2 rounded-full ${getStatusColor(item.value)}`}
                        />
                        <span className='font-mono text-sm font-semibold tabular-nums'>
                          {item.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Site Structure & Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Site Structure & Performance</CardTitle>
                <CardDescription>
                  Navigation, speed, and internal linking health
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {[
                    {
                      label: 'Orphaned Pages',
                      desc: 'Pages with no incoming links from your site',
                      value: displayAudit?.total_orphaned_pages ?? 0
                    },
                    {
                      label: 'Deep Pages',
                      desc: 'Pages requiring many clicks to reach from the homepage',
                      value: displayAudit?.pages_deep ?? 0
                    },
                    {
                      label: 'Slow Response',
                      desc: 'Pages taking too long to load',
                      value: displayAudit?.pages_slow_response ?? 0
                    },
                    {
                      label: 'Broken Internal Links',
                      desc: 'Links pointing to pages that no longer exist',
                      value: displayAudit?.total_broken_internal_links ?? 0
                    },
                    {
                      label: 'Redirect Chains',
                      desc: 'Links passing through multiple redirects before reaching the destination',
                      value: displayAudit?.pages_in_redirect_chain ?? 0
                    },
                    {
                      label: 'Broken Pagination',
                      desc: 'Issues with next/previous page navigation',
                      value: displayAudit?.pages_broken_pagination ?? 0
                    }
                  ].map((item) => (
                    <div
                      key={item.label}
                      className='flex items-start justify-between gap-4'
                    >
                      <div className='min-w-0 flex-1'>
                        <p className='text-sm font-medium'>{item.label}</p>
                        <p className='text-muted-foreground text-xs'>
                          {item.desc}
                        </p>
                      </div>
                      <div className='flex shrink-0 items-center gap-2 pt-0.5'>
                        <div
                          className={`h-2 w-2 rounded-full ${getStatusColor(item.value)}`}
                        />
                        <span className='font-mono text-sm font-semibold tabular-nums'>
                          {item.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Content & Media ──────────────────────────── */}
          <div>
            <h3 className='text-lg font-semibold'>Content & Media</h3>
            <p className='text-muted-foreground mt-1 text-sm'>
              Quality of your page content and images
            </p>
          </div>

          {/* F. Content & Images Row — 1/2 + 1/2 */}
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
            {/* Content Quality */}
            <Card>
              <CardHeader>
                <div className='flex items-center gap-2'>
                  <IconFileText className='text-muted-foreground h-4 w-4' />
                  <CardTitle>Content Quality</CardTitle>
                </div>
                <CardDescription>
                  Content health across crawled pages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {[
                    {
                      label: 'Thin Content',
                      desc: 'Pages with very little text content',
                      value: displayAudit?.pages_thin_content ?? 0,
                      color: 'text-amber-600 dark:text-amber-400'
                    },
                    {
                      label: 'Exact Duplicates',
                      desc: 'Pages with identical content to another page',
                      value: displayAudit?.pages_exact_duplicate_content ?? 0,
                      color: 'text-red-600 dark:text-red-400'
                    },
                    {
                      label: 'Similar Content',
                      desc: 'Pages with closely matching content',
                      value: displayAudit?.pages_content_similarity ?? 0,
                      color: 'text-amber-600 dark:text-amber-400'
                    },
                    {
                      label: 'Duplicate Titles',
                      desc: 'Pages sharing the same title tag',
                      value: displayAudit?.pages_duplicate_title ?? 0,
                      color: 'text-amber-600 dark:text-amber-400'
                    },
                    {
                      label: 'Duplicate Descriptions',
                      desc: 'Pages sharing the same meta description',
                      value: displayAudit?.pages_duplicate_description ?? 0,
                      color: 'text-amber-600 dark:text-amber-400'
                    }
                  ].map((item) => (
                    <div key={item.label}>
                      <div className='flex items-center justify-between text-sm'>
                        <span className='font-medium'>{item.label}</span>
                        <span
                          className={`font-mono font-semibold tabular-nums ${item.value > 0 ? item.color : ''}`}
                        >
                          {item.value}
                        </span>
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        {item.desc}
                      </p>
                    </div>
                  ))}
                  <Separator />
                  <div>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='font-medium'>Schema Markup</span>
                      <div className='flex items-center gap-2'>
                        <span className='font-mono font-semibold tabular-nums'>
                          {displayAudit?.pages_with_schema ?? 0}
                        </span>
                        <span className='text-muted-foreground text-xs'>
                          of {schemaTotal} pages ({schemaPct}%)
                        </span>
                      </div>
                    </div>
                    <p className='text-muted-foreground text-xs'>
                      Structured data helping search engines understand your
                      content
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Image Optimization */}
            <Card>
              <CardHeader>
                <div className='flex items-center gap-2'>
                  <IconPhoto className='text-muted-foreground h-4 w-4' />
                  <CardTitle>Image Optimization</CardTitle>
                </div>
                <CardDescription>
                  {displayAudit?.total_images ?? 0} images discovered across the
                  site
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {[
                    {
                      label: 'Missing Alt Text',
                      desc: 'Images without accessibility descriptions',
                      value: displayAudit?.total_images_missing_alt ?? 0,
                      total: displayAudit?.total_images ?? 0,
                      color: 'text-red-600 dark:text-red-400',
                      barColor: '[&_[data-slot=progress-indicator]]:bg-red-500'
                    },
                    {
                      label: 'Empty Alt Text',
                      desc: 'Images with blank alt attributes',
                      value: displayAudit?.total_images_empty_alt ?? 0,
                      total: displayAudit?.total_images ?? 0,
                      color: 'text-amber-600 dark:text-amber-400',
                      barColor:
                        '[&_[data-slot=progress-indicator]]:bg-amber-500'
                    },
                    {
                      label: 'Missing Dimensions',
                      desc: 'Images without width/height, causing layout shift',
                      value: displayAudit?.total_images_missing_dimensions ?? 0,
                      total: displayAudit?.total_images ?? 0,
                      color: 'text-amber-600 dark:text-amber-400',
                      barColor:
                        '[&_[data-slot=progress-indicator]]:bg-amber-500'
                    },
                    {
                      label: 'Unoptimized Format',
                      desc: 'Images not using modern formats like WebP or AVIF',
                      value: displayAudit?.total_images_unoptimized_format ?? 0,
                      total: displayAudit?.total_images ?? 0,
                      color: 'text-sky-600 dark:text-sky-400',
                      barColor: '[&_[data-slot=progress-indicator]]:bg-sky-500'
                    }
                  ].map((item) => (
                    <div key={item.label} className='space-y-1.5'>
                      <div className='flex items-center justify-between text-sm'>
                        <span className='font-medium'>{item.label}</span>
                        <span
                          className={`font-mono font-semibold tabular-nums ${item.value > 0 ? item.color : ''}`}
                        >
                          {item.value}
                        </span>
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        {item.desc}
                      </p>
                      <Progress
                        value={
                          item.total > 0 ? (item.value / item.total) * 100 : 0
                        }
                        className={`h-1.5 ${item.barColor}`}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Recommended Next Steps ───────────────────── */}
          <div>
            <h3 className='text-lg font-semibold'>Recommended Next Steps</h3>
            <p className='text-muted-foreground mt-1 text-sm'>
              Based on this audit, here&apos;s where to focus
            </p>
          </div>

          {/* H. Recommendations */}
          <Card>
            <CardContent className='pt-6'>
              {topRecommendations.length === 0 ? (
                <div className='flex items-center justify-center py-8 text-center'>
                  <div>
                    <p className='text-sm font-medium'>
                      Your site is in great shape!
                    </p>
                    <p className='text-muted-foreground mt-1 text-xs'>
                      No urgent issues detected.
                    </p>
                  </div>
                </div>
              ) : (
                <div className='space-y-5'>
                  {topRecommendations.map((rec, i) => (
                    <div key={i} className='flex items-start gap-3'>
                      <div className='bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold'>
                        {i + 1}
                      </div>
                      <div>
                        <p className='text-sm font-medium'>{rec.title}</p>
                        <p className='text-muted-foreground text-xs'>
                          {rec.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer CTA */}
          <div className='flex justify-center'>
            <Button asChild>
              <Link href={`/dashboard/${cid}/audits`}>
                View Full Audit Log &rarr;
              </Link>
            </Button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

// src/app/dashboard/[clientId]/overview/page.tsx
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import LiveAuditGate from './LiveAuditGate';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import PageContainer from '@/components/layout/page-container';
import { CrawlLiveFeed } from '@/components/ui/crawl-live-feed';
import { getClientOverviewData } from '@/features/overview/lib/get-client-overview-data';
import { ensureClientAccess } from '@/lib/auth/memberships';
import { AuditProgressChart } from '@/features/overview/components/audit-progress-chart';
import ReCrawlButton from '@/features/overview/components/re-crawl-button';
import { AreaGraphStatusCodes } from '@/features/overview/components/area-graph-status-codes';
import { DoughnutGraph } from '@/features/overview/components/doughnut-graph';
import {
  computeOverviewStats,
  prettyIssue
} from '@/features/overview/lib/compute-overview-stats';

// ── helpers ──────────────────────────────────────────────────────

const statusDot = (value: number) =>
  value === 0 ? 'bg-emerald-500' : value <= 5 ? 'bg-amber-500' : 'bg-red-500';

const SEVERITY_ROWS = [
  {
    key: 'Alert' as const,
    label: 'Critical',
    dotColor: 'bg-red-500',
    color: 'text-red-600 dark:text-red-400',
    barColor: '[&_[data-slot=progress-indicator]]:bg-red-500'
  },
  {
    key: 'Warning' as const,
    label: 'Warnings',
    dotColor: 'bg-amber-500',
    color: 'text-amber-600 dark:text-amber-400',
    barColor: '[&_[data-slot=progress-indicator]]:bg-amber-500'
  },
  {
    key: 'Opportunity' as const,
    label: 'Opportunities',
    dotColor: 'bg-sky-500',
    color: 'text-sky-600 dark:text-sky-400',
    barColor: '[&_[data-slot=progress-indicator]]:bg-sky-500'
  }
];

// ── page ─────────────────────────────────────────────────────────

export default async function ClientOverviewPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const { userId } = await auth();

  if (!userId) redirect('/auth/sign-in');

  const cid = Number(clientId);
  if (!Number.isFinite(cid)) notFound();

  const [membership, overview] = await Promise.all([
    ensureClientAccess(userId, cid),
    getClientOverviewData(cid)
  ]);

  if (!membership) notFound();

  const { client, latest, previous, latestCrawl } = overview;

  const crawlAbortedWithoutAudit =
    latestCrawl?.state === 'ABORTED' &&
    (!latest || latestCrawl.id !== latest.crawlId);

  const displayAudit = crawlAbortedWithoutAudit && previous ? previous : latest;
  const comparisonAudit =
    crawlAbortedWithoutAudit && previous ? latest : previous;

  const shouldListenForUpdates =
    (!latest && !previous) || latestCrawl?.state === 'STARTED';

  // ── derived values ──────────────────────────────────────────────

  const crawlStatusLabel =
    latestCrawl?.state === 'STARTED'
      ? 'In progress'
      : latestCrawl?.state === 'COMPLETED'
        ? 'Completed'
        : latestCrawl?.state === 'ABORTED'
          ? 'Aborted'
          : 'Not started';

  const crawlBadgeClass =
    latestCrawl?.state === 'COMPLETED'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 border-transparent'
      : latestCrawl?.state === 'STARTED'
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border-transparent'
        : latestCrawl?.state === 'ABORTED'
          ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300 border-transparent'
          : '';

  const lastAuditAt = displayAudit?.createdAt
    ? new Date(displayAudit.createdAt).toLocaleString()
    : null;

  const audit = displayAudit as Record<string, unknown> | null;
  const num = (k: string) => (audit?.[k] as number) ?? 0;

  const stats = displayAudit
    ? computeOverviewStats(
        displayAudit as Record<string, unknown>,
        comparisonAudit as Record<string, unknown> | null
      )
    : null;

  const totalIssues = stats
    ? stats.severityTotals.Alert +
      stats.severityTotals.Warning +
      stats.severityTotals.Opportunity
    : 0;

  // ── render ──────────────────────────────────────────────────────

  return (
    <PageContainer>
      <LiveAuditGate
        clientId={cid}
        initialLatestId={latest?.id ?? null}
        enabled={shouldListenForUpdates}
      />

      {!displayAudit ? (
        <CrawlLiveFeed clientId={cid} domain={client?.url} />
      ) : (
        <div className='flex flex-1 flex-col gap-8 pb-12'>
          {/* ── Header ─────────────────────────────────── */}
          <div className='flex flex-wrap items-start justify-between gap-4'>
            <div>
              <div className='flex items-center gap-2.5'>
                <h2 className='text-xl font-semibold'>
                  {client?.name ?? 'Client overview'}
                </h2>
                <Badge
                  variant='outline'
                  className={`text-xs ${crawlBadgeClass}`}
                >
                  {crawlStatusLabel}
                </Badge>
              </div>
              <p className='text-muted-foreground mt-0.5 text-sm'>
                {client?.url ?? 'No URL set'}
              </p>
            </div>
            <div className='flex items-center gap-3'>
              {lastAuditAt && (
                <span className='text-muted-foreground text-xs'>
                  Last audit: {lastAuditAt}
                </span>
              )}
              {client?.url && (
                <ReCrawlButton
                  clientId={String(cid)}
                  url={client.url}
                  disabled={latestCrawl?.state === 'STARTED'}
                />
              )}
            </div>
          </div>

          {/* ── At a Glance ────────────────────────────── */}
          <Card>
            <CardContent className='p-6'>
              <div className='flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10'>
                {/* Score donut */}
                <div className='shrink-0'>
                  <DoughnutGraph auditScore={displayAudit?.score ?? 0} />
                </div>

                {/* Severity breakdown */}
                <div className='flex-1 space-y-3'>
                  {SEVERITY_ROWS.map((row) => {
                    const count = stats?.severityTotals[row.key] ?? 0;
                    const pct =
                      totalIssues > 0 ? (count / totalIssues) * 100 : 0;
                    return (
                      <div key={row.key} className='flex items-center gap-3'>
                        <div className='flex w-32 shrink-0 items-center gap-2'>
                          <div
                            className={`h-2 w-2 shrink-0 rounded-full ${row.dotColor}`}
                          />
                          <span className='text-sm font-medium'>
                            {row.label}
                          </span>
                        </div>
                        <span
                          className={`w-10 shrink-0 text-xl font-bold tabular-nums ${row.color}`}
                        >
                          {count}
                        </span>
                        <Progress
                          value={pct}
                          className={`h-1.5 flex-1 ${row.barColor}`}
                        />
                        {row.key === 'Alert' && count > 0 && (
                          <Link
                            href={`/dashboard/${cid}/audits`}
                            className='text-muted-foreground hover:text-foreground ml-1 shrink-0 text-xs transition-colors'
                          >
                            View →
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator className='my-5' />

              {/* Footer strip */}
              <div className='flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs'>
                <span className='text-muted-foreground'>
                  <span className='text-foreground font-medium'>
                    {totalIssues}
                  </span>{' '}
                  total issues
                </span>
                <span className='text-muted-foreground'>
                  <span className='text-foreground font-medium'>
                    {stats?.totalPages ?? 0}
                  </span>{' '}
                  pages crawled
                </span>
                {(stats?.newIssuesCount ?? 0) > 0 && (
                  <span className='font-medium text-red-500'>
                    +{stats!.newIssuesCount} new this crawl
                  </span>
                )}
                {(stats?.resolvedIssuesCount ?? 0) > 0 && (
                  <span className='font-medium text-emerald-600'>
                    −{stats!.resolvedIssuesCount} resolved
                  </span>
                )}
                <Link
                  href={`/dashboard/${cid}/audits`}
                  className='text-muted-foreground hover:text-foreground ml-auto transition-colors'
                >
                  View full audit →
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* ── Trends ─────────────────────────────────── */}
          <section className='space-y-4'>
            <SectionLabel>Trends</SectionLabel>
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
              <AuditProgressChart />
              <AreaGraphStatusCodes />
            </div>
          </section>

          {/* ── Site Health ────────────────────────────── */}
          <section className='space-y-4'>
            <SectionLabel>Site Health</SectionLabel>
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle>Crawlability & Indexing</CardTitle>
                  <CardDescription>
                    How well search engines can discover and index your pages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MetricList
                    items={[
                      {
                        label: 'Blocked by Robots',
                        desc: 'Pages your robots.txt prevents search engines from seeing',
                        value: num('pages_blocked_by_robots')
                      },
                      {
                        label: 'Non-Indexable',
                        desc: 'Pages that search engines cannot add to their index',
                        value: num('pages_non_indexable')
                      },
                      {
                        label: 'Noindex Pages',
                        desc: "Pages you've explicitly told search engines to skip",
                        value: num('pages_noindex')
                      },
                      {
                        label: 'Not in Sitemap',
                        desc: 'Crawled pages missing from your XML sitemap',
                        value: num('pages_not_in_sitemap')
                      },
                      {
                        label: 'Sitemap Errors',
                        desc: 'Sitemap URLs returning errors instead of live pages',
                        value:
                          num('pages_in_sitemap_non_200') +
                          num('pages_in_sitemap_not_crawled')
                      },
                      {
                        label: 'Mixed Content',
                        desc: 'HTTPS pages loading insecure HTTP resources',
                        value: num('pages_with_mixed_content')
                      }
                    ]}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Site Structure & Performance</CardTitle>
                  <CardDescription>
                    Navigation, speed, and internal linking health
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MetricList
                    items={[
                      {
                        label: 'Orphaned Pages',
                        desc: 'Pages with no incoming links from your site',
                        value: num('total_orphaned_pages')
                      },
                      {
                        label: 'Deep Pages',
                        desc: 'Pages requiring many clicks to reach from the homepage',
                        value: num('pages_deep')
                      },
                      {
                        label: 'Slow Response',
                        desc: 'Pages taking too long to load',
                        value: num('pages_slow_response')
                      },
                      {
                        label: 'Broken Internal Links',
                        desc: 'Links pointing to pages that no longer exist',
                        value: num('total_broken_internal_links')
                      },
                      {
                        label: 'Redirect Chains',
                        desc: 'Links passing through multiple redirects',
                        value: num('pages_in_redirect_chain')
                      },
                      {
                        label: 'Broken Pagination',
                        desc: 'Issues with next/previous page navigation',
                        value: num('pages_broken_pagination')
                      }
                    ]}
                  />
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ── Content & Media ────────────────────────── */}
          <section className='space-y-4'>
            <SectionLabel>Content & Media</SectionLabel>
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle>Content Quality</CardTitle>
                  <CardDescription>
                    Content health across crawled pages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MetricList
                    items={[
                      {
                        label: 'Thin Content',
                        desc: 'Pages with very little text content',
                        value: num('pages_thin_content')
                      },
                      {
                        label: 'Exact Duplicates',
                        desc: 'Pages with identical content to another page',
                        value: num('pages_exact_duplicate_content')
                      },
                      {
                        label: 'Similar Content',
                        desc: 'Pages with closely matching content',
                        value: num('pages_content_similarity')
                      },
                      {
                        label: 'Duplicate Titles',
                        desc: 'Pages sharing the same title tag',
                        value: num('pages_duplicate_title')
                      },
                      {
                        label: 'Duplicate Descriptions',
                        desc: 'Pages sharing the same meta description',
                        value: num('pages_duplicate_description')
                      },
                      {
                        label: 'Schema Markup',
                        desc: 'Structured data coverage across your site',
                        value: num('pages_with_schema'),
                        suffix: `of ${stats?.schemaTotal ?? 0} pages`
                      }
                    ]}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Image Optimization</CardTitle>
                  <CardDescription>
                    {num('total_images').toLocaleString()} images discovered
                    across the site
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {[
                      {
                        label: 'Missing Alt Text',
                        desc: 'Images without accessibility descriptions',
                        value: num('total_images_missing_alt'),
                        total: num('total_images'),
                        barColor:
                          '[&_[data-slot=progress-indicator]]:bg-red-500'
                      },
                      {
                        label: 'Empty Alt Text',
                        desc: 'Images with blank alt attributes',
                        value: num('total_images_empty_alt'),
                        total: num('total_images'),
                        barColor:
                          '[&_[data-slot=progress-indicator]]:bg-amber-500'
                      },
                      {
                        label: 'Missing Dimensions',
                        desc: 'Images without width/height, causing layout shift',
                        value: num('total_images_missing_dimensions'),
                        total: num('total_images'),
                        barColor:
                          '[&_[data-slot=progress-indicator]]:bg-amber-500'
                      },
                      {
                        label: 'Unoptimized Format',
                        desc: 'Images not using WebP or AVIF',
                        value: num('total_images_unoptimized_format'),
                        total: num('total_images'),
                        barColor:
                          '[&_[data-slot=progress-indicator]]:bg-sky-500'
                      }
                    ].map((item) => {
                      const pct =
                        item.total > 0
                          ? Math.round((item.value / item.total) * 100)
                          : 0;
                      return (
                        <div key={item.label} className='space-y-1.5'>
                          <div className='flex items-start justify-between gap-4'>
                            <div className='min-w-0 flex-1'>
                              <p className='text-sm font-medium'>
                                {item.label}
                              </p>
                              <p className='text-muted-foreground text-xs'>
                                {item.desc}
                              </p>
                            </div>
                            <div className='shrink-0 text-right'>
                              <span className='font-mono text-sm font-semibold tabular-nums'>
                                {item.value.toLocaleString()}
                              </span>
                              {pct > 0 && (
                                <p className='text-muted-foreground text-xs'>
                                  {pct}%
                                </p>
                              )}
                            </div>
                          </div>
                          <Progress
                            value={pct}
                            className={`h-1 ${item.barColor}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ── Recommended Next Steps ─────────────────── */}
          {(stats?.recommendations.length ?? 0) > 0 && (
            <section className='space-y-4'>
              <SectionLabel>Recommended Next Steps</SectionLabel>
              <Card>
                <CardContent className='pt-6'>
                  <div className='space-y-5'>
                    {stats!.recommendations.map((rec, i) => (
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
                </CardContent>
              </Card>
            </section>
          )}
        </div>
      )}
    </PageContainer>
  );
}

// ── sub-components ───────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
      {children}
    </p>
  );
}

function MetricList({
  items
}: {
  items: {
    label: string;
    desc: string;
    value: number;
    suffix?: string;
  }[];
}) {
  return (
    <div className='space-y-4'>
      {items.map((item) => (
        <div
          key={item.label}
          className='flex items-start justify-between gap-4'
        >
          <div className='min-w-0 flex-1'>
            <p className='text-sm font-medium'>{item.label}</p>
            <p className='text-muted-foreground text-xs'>{item.desc}</p>
          </div>
          <div className='shrink-0 text-right'>
            <div className='flex items-center gap-1.5'>
              <div
                className={`h-2 w-2 rounded-full ${statusDot(item.value)}`}
              />
              <span className='font-mono text-sm font-semibold tabular-nums'>
                {item.value.toLocaleString()}
              </span>
            </div>
            {item.suffix && (
              <p className='text-muted-foreground text-xs'>{item.suffix}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

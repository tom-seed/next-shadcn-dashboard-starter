import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { ensureClientAccess } from '@/lib/auth/memberships';
import { getClientOverviewData } from '@/features/overview/lib/get-client-overview-data';

type Severity = 'critical' | 'warning' | 'info';

interface IssueRow {
  field: string;
  label: string;
  severity: Severity;
  pagesField?: string;
}

const severityStyle: Record<Severity, { badge: string; text: string }> = {
  critical: {
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
    text: 'text-red-600 dark:text-red-400'
  },
  warning: {
    badge:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
    text: 'text-amber-600 dark:text-amber-400'
  },
  info: {
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
    text: 'text-blue-600 dark:text-blue-400'
  }
};

const canonicalRows: IssueRow[] = [
  {
    field: 'pages_missing_canonical',
    label: 'Missing Canonical',
    severity: 'warning'
  },
  {
    field: 'canonical_points_to_redirect',
    label: 'Canonical → Redirect',
    severity: 'warning'
  },
  {
    field: 'canonical_points_to_404',
    label: 'Canonical → 404',
    severity: 'critical'
  },
  {
    field: 'canonical_points_to_4xx',
    label: 'Canonical → 4xx',
    severity: 'critical'
  },
  {
    field: 'canonical_points_to_5xx',
    label: 'Canonical → 5xx',
    severity: 'critical'
  }
];

const hreflangRows: IssueRow[] = [
  {
    field: 'pages_hreflang_broken_links',
    label: 'Broken Hreflang Links',
    severity: 'critical',
    pagesField: 'total_hreflang_broken_links'
  },
  {
    field: 'pages_hreflang_missing_return_tag',
    label: 'Missing Return Tag',
    severity: 'warning',
    pagesField: 'total_hreflang_missing_return_tags'
  },
  {
    field: 'pages_hreflang_missing_self_ref',
    label: 'Missing Self Reference',
    severity: 'warning'
  },
  {
    field: 'pages_missing_hreflang_x_default',
    label: 'Missing x-default',
    severity: 'warning'
  }
];

export default async function LinksReportPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const { userId } = await auth();
  if (!userId) redirect('/auth/sign-in');

  const cid = Number(clientId);
  if (!Number.isFinite(cid)) notFound();

  const membership = await ensureClientAccess(userId, cid);
  if (!membership) notFound();

  const { latest, previous } = await getClientOverviewData(cid);
  if (!latest) {
    return (
      <PageContainer>
        <div className='flex min-h-[40vh] items-center justify-center'>
          <p className='text-muted-foreground'>No audit data available yet.</p>
        </div>
      </PageContainer>
    );
  }

  const audit = latest as Record<string, any>;
  const prev = (previous as Record<string, any>) ?? null;

  const val = (field: string) => (audit[field] as number) ?? 0;
  const prevVal = (field: string) =>
    prev ? ((prev[field] as number) ?? 0) : null;

  function DeltaBadge({
    current,
    previous: p,
    invertColor
  }: {
    current: number;
    previous: number | null;
    invertColor?: boolean;
  }) {
    if (p === null) return null;
    const diff = current - p;
    if (diff === 0) return null;
    const isUp = diff > 0;
    const upColor = invertColor ? 'text-green-600' : 'text-red-600';
    const downColor = invertColor ? 'text-red-600' : 'text-green-600';
    return (
      <Badge variant='outline' className={isUp ? upColor : downColor}>
        {isUp ? (
          <IconTrendingUp className='mr-1 h-3 w-3' />
        ) : (
          <IconTrendingDown className='mr-1 h-3 w-3' />
        )}
        {isUp ? `+${diff}` : diff}
      </Badge>
    );
  }

  const summaryCards: {
    label: string;
    field: string;
    color: string;
    barColor: string;
    invertDelta?: boolean;
  }[] = [
    {
      label: 'Orphaned Pages',
      field: 'total_orphaned_pages',
      color: 'text-red-600 dark:text-red-400',
      barColor: '[&_[data-slot=progress-indicator]]:bg-red-500'
    },
    {
      label: 'Broken Internal Links',
      field: 'total_broken_internal_links',
      color: 'text-red-600 dark:text-red-400',
      barColor: '[&_[data-slot=progress-indicator]]:bg-red-500'
    },
    {
      label: 'Redirect Internal Links',
      field: 'total_redirect_internal_links',
      color: 'text-amber-600 dark:text-amber-400',
      barColor: '[&_[data-slot=progress-indicator]]:bg-amber-500'
    },
    {
      label: 'Canonicalised Pages',
      field: 'pages_canonicalised',
      color: 'text-blue-600 dark:text-blue-400',
      barColor: '[&_[data-slot=progress-indicator]]:bg-blue-500',
      invertDelta: true
    }
  ];

  const totalPages =
    val('pages_200_response') +
    val('pages_3xx_response') +
    val('pages_4xx_response') +
    val('pages_5xx_response');

  function IssueList({
    rows,
    title,
    description,
    summaryLabel,
    summaryField
  }: {
    rows: IssueRow[];
    title: string;
    description: string;
    summaryLabel?: string;
    summaryField?: string;
  }) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {summaryLabel && summaryField && (
            <div className='bg-muted/30 mb-4 flex items-center justify-between rounded-md p-3'>
              <span className='text-sm font-medium'>{summaryLabel}</span>
              <span className='text-xl font-bold tabular-nums'>
                {val(summaryField)}
              </span>
            </div>
          )}
          <div className='space-y-1'>
            {rows.map((r) => {
              const count = val(r.field);
              const p = prevVal(r.field);
              const cfg = severityStyle[r.severity];
              return (
                <Link
                  key={r.field}
                  href={`/dashboard/${cid}/audits/issues/${r.field.replace(/_/g, '-')}`}
                  className='hover:bg-muted/50 flex items-center justify-between rounded-md px-3 py-2.5 text-sm transition-colors'
                >
                  <div className='flex items-center gap-2'>
                    <Badge
                      variant='outline'
                      className={`border-transparent text-xs ${cfg.badge}`}
                    >
                      {r.severity === 'critical'
                        ? 'Critical'
                        : r.severity === 'warning'
                          ? 'Warning'
                          : 'Info'}
                    </Badge>
                    <span className='font-medium'>{r.label}</span>
                  </div>
                  <div className='flex items-center gap-3'>
                    <span
                      className={`text-lg font-bold tabular-nums ${count > 0 ? cfg.text : 'text-muted-foreground'}`}
                    >
                      {count}
                    </span>
                    {r.pagesField && (
                      <span className='text-muted-foreground text-xs'>
                        ({val(r.pagesField)} total)
                      </span>
                    )}
                    <DeltaBadge current={count} previous={p} />
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col gap-6'>
        <Heading
          title='Links & Indexing'
          description='Internal link structure, canonical tags, and hreflang status'
        />

        {/* Summary cards */}
        <div className='grid gap-4 md:grid-cols-4'>
          {summaryCards.map((c) => {
            const count = val(c.field);
            const p = prevVal(c.field);
            const pct =
              totalPages > 0 ? Math.round((count / totalPages) * 100) : 0;
            return (
              <Card key={c.field}>
                <CardContent className='flex flex-col gap-2 py-4'>
                  <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                    {c.label}
                  </p>
                  <div className='flex items-baseline gap-2'>
                    <span
                      className={`text-2xl font-bold tabular-nums ${c.color}`}
                    >
                      {count}
                    </span>
                    <DeltaBadge
                      current={count}
                      previous={p}
                      invertColor={c.invertDelta}
                    />
                  </div>
                  <Progress
                    value={Math.min(pct, 100)}
                    className={`h-1.5 ${c.barColor}`}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Canonical + Hreflang detail */}
        <div className='grid gap-4 md:grid-cols-2'>
          <IssueList
            rows={canonicalRows}
            title='Canonical Tag Issues'
            description='Pages with canonical tag problems'
          />
          <IssueList
            rows={hreflangRows}
            title='Hreflang Status'
            description='Multilingual page annotation issues'
            summaryLabel='Pages with Hreflang'
            summaryField='pages_with_hreflang'
          />
        </div>
      </div>
    </PageContainer>
  );
}

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

type Severity = 'critical' | 'warning' | 'opportunity';

interface IssueRow {
  field: string;
  label: string;
  severity: Severity;
}

const severityConfig: Record<
  Severity,
  { badge: string; text: string; bar: string }
> = {
  critical: {
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
    text: 'text-red-600 dark:text-red-400',
    bar: '[&_[data-slot=progress-indicator]]:bg-red-500'
  },
  warning: {
    badge:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
    text: 'text-amber-600 dark:text-amber-400',
    bar: '[&_[data-slot=progress-indicator]]:bg-amber-500'
  },
  opportunity: {
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300',
    text: 'text-sky-600 dark:text-sky-400',
    bar: '[&_[data-slot=progress-indicator]]:bg-sky-500'
  }
};

const titleRows: IssueRow[] = [
  {
    field: 'pages_missing_title',
    label: 'Missing Title',
    severity: 'critical'
  },
  {
    field: 'too_short_title',
    label: 'Too Short Title',
    severity: 'opportunity'
  },
  { field: 'too_long_title', label: 'Too Long Title', severity: 'opportunity' }
];

const descriptionRows: IssueRow[] = [
  {
    field: 'pages_missing_description',
    label: 'Missing Description',
    severity: 'critical'
  },
  {
    field: 'too_short_description',
    label: 'Too Short Description',
    severity: 'opportunity'
  },
  {
    field: 'too_long_description',
    label: 'Too Long Description',
    severity: 'opportunity'
  }
];

const headingRows: IssueRow[] = [
  { field: 'pages_missing_h1', label: 'Missing H1', severity: 'critical' },
  {
    field: 'pages_with_multiple_h1s',
    label: 'Multiple H1s',
    severity: 'warning'
  },
  {
    field: 'pages_with_duplicate_h1s',
    label: 'Duplicate H1s',
    severity: 'warning'
  },
  { field: 'pages_missing_h2', label: 'Missing H2', severity: 'warning' },
  {
    field: 'pages_with_multiple_h2s',
    label: 'Multiple H2s',
    severity: 'opportunity'
  },
  {
    field: 'pages_with_duplicate_h2s',
    label: 'Duplicate H2s',
    severity: 'warning'
  },
  { field: 'pages_missing_h3', label: 'Missing H3', severity: 'opportunity' },
  {
    field: 'pages_with_multiple_h3s',
    label: 'Multiple H3s',
    severity: 'opportunity'
  },
  {
    field: 'pages_with_duplicate_h3s',
    label: 'Duplicate H3s',
    severity: 'opportunity'
  },
  { field: 'pages_missing_h4', label: 'Missing H4', severity: 'opportunity' },
  {
    field: 'pages_with_multiple_h4s',
    label: 'Multiple H4s',
    severity: 'opportunity'
  },
  {
    field: 'pages_with_duplicate_h4s',
    label: 'Duplicate H4s',
    severity: 'opportunity'
  },
  { field: 'pages_missing_h5', label: 'Missing H5', severity: 'opportunity' },
  {
    field: 'pages_with_multiple_h5s',
    label: 'Multiple H5s',
    severity: 'opportunity'
  },
  {
    field: 'pages_with_duplicate_h5s',
    label: 'Duplicate H5s',
    severity: 'opportunity'
  },
  { field: 'pages_missing_h6', label: 'Missing H6', severity: 'opportunity' },
  {
    field: 'pages_with_multiple_h6s',
    label: 'Multiple H6s',
    severity: 'opportunity'
  },
  {
    field: 'pages_with_duplicate_h6s',
    label: 'Duplicate H6s',
    severity: 'opportunity'
  }
];

export default async function SEOHealthReportPage({
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

  const sumFields = (rows: IssueRow[]) =>
    rows.reduce((acc, r) => acc + val(r.field), 0);
  const prevSumFields = (rows: IssueRow[]) =>
    prev ? rows.reduce((acc, r) => acc + (prevVal(r.field) ?? 0), 0) : null;

  const titleTotal = sumFields(titleRows);
  const descTotal = sumFields(descriptionRows);
  const headingTotal = sumFields(headingRows);
  const prevTitleTotal = prevSumFields(titleRows);
  const prevDescTotal = prevSumFields(descriptionRows);
  const prevHeadingTotal = prevSumFields(headingRows);

  const totalPages =
    (audit.pages_200_response ?? 0) +
    (audit.pages_3xx_response ?? 0) +
    (audit.pages_4xx_response ?? 0) +
    (audit.pages_5xx_response ?? 0);

  function DeltaBadge({
    current,
    previous: p
  }: {
    current: number;
    previous: number | null;
  }) {
    if (p === null) return null;
    const diff = current - p;
    if (diff === 0) return null;
    const isUp = diff > 0;
    return (
      <Badge
        variant='outline'
        className={isUp ? 'text-red-600' : 'text-green-600'}
      >
        {isUp ? (
          <IconTrendingUp className='mr-1 h-3 w-3' />
        ) : (
          <IconTrendingDown className='mr-1 h-3 w-3' />
        )}
        {isUp ? `+${diff}` : diff}
      </Badge>
    );
  }

  function IssueList({
    rows,
    title,
    description
  }: {
    rows: IssueRow[];
    title: string;
    description: string;
  }) {
    const visibleRows = rows.filter(
      (r) =>
        val(r.field) > 0 ||
        r.severity === 'critical' ||
        r.severity === 'warning'
    );
    if (visibleRows.length === 0) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-1'>
            {visibleRows.map((r) => {
              const count = val(r.field);
              const p = prevVal(r.field);
              const cfg = severityConfig[r.severity];
              const pct =
                totalPages > 0 ? Math.round((count / totalPages) * 100) : 0;

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
                          : 'Opportunity'}
                    </Badge>
                    <span className='font-medium'>{r.label}</span>
                  </div>
                  <div className='flex items-center gap-3'>
                    <div className='flex items-center gap-2'>
                      <span
                        className={`text-lg font-bold tabular-nums ${cfg.text}`}
                      >
                        {count}
                      </span>
                      <span className='text-muted-foreground text-xs'>
                        {pct}%
                      </span>
                    </div>
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

  function SummaryCard({
    label,
    count,
    prevCount,
    color,
    barColor
  }: {
    label: string;
    count: number;
    prevCount: number | null;
    color: string;
    barColor: string;
  }) {
    const pct = totalPages > 0 ? Math.round((count / totalPages) * 100) : 0;
    return (
      <Card>
        <CardContent className='flex flex-col gap-2 py-4'>
          <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
            {label}
          </p>
          <div className='flex items-baseline gap-2'>
            <span className={`text-2xl font-bold tabular-nums ${color}`}>
              {count}
            </span>
            <span className='text-muted-foreground text-xs'>{pct}%</span>
            <DeltaBadge current={count} previous={prevCount} />
          </div>
          <Progress value={pct} className={`h-1.5 ${barColor}`} />
        </CardContent>
      </Card>
    );
  }

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col gap-6'>
        <Heading
          title='SEO Health'
          description='Title tags, meta descriptions, and heading structure analysis'
        />

        {/* Summary cards */}
        <div className='grid gap-4 md:grid-cols-3'>
          <SummaryCard
            label='Title Issues'
            count={titleTotal}
            prevCount={prevTitleTotal}
            color={severityConfig.critical.text}
            barColor={severityConfig.critical.bar}
          />
          <SummaryCard
            label='Description Issues'
            count={descTotal}
            prevCount={prevDescTotal}
            color={severityConfig.warning.text}
            barColor={severityConfig.warning.bar}
          />
          <SummaryCard
            label='Heading Issues'
            count={headingTotal}
            prevCount={prevHeadingTotal}
            color={severityConfig.opportunity.text}
            barColor={severityConfig.opportunity.bar}
          />
        </div>

        {/* Detailed breakdowns */}
        <IssueList
          rows={titleRows}
          title='Title Tags'
          description='Page title optimization'
        />
        <IssueList
          rows={descriptionRows}
          title='Meta Descriptions'
          description='Description tag optimization'
        />
        <IssueList
          rows={headingRows}
          title='Headings'
          description='H1–H6 heading structure'
        />
      </div>
    </PageContainer>
  );
}

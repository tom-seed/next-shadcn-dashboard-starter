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
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { StatCard } from '@/components/ui/stat-card';
import { DeltaBadge } from '@/components/ui/delta-badge';
import { severityConfig } from '@/lib/severity';
import type { Severity } from '@/lib/severity';
import { ensureClientAccess } from '@/lib/auth/memberships';
import { getClientOverviewData } from '@/features/overview/lib/get-client-overview-data';

interface IssueRow {
  field: string;
  label: string;
  severity: Severity;
}

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

  const audit = latest as Record<string, unknown>;
  const prev = (previous as Record<string, unknown>) ?? null;

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

  const totalPages =
    val('pages_200_response') +
    val('pages_3xx_response') +
    val('pages_4xx_response') +
    val('pages_5xx_response');

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col gap-6'>
        <Heading
          title='SEO Health'
          description='Title tags, meta descriptions, and heading structure analysis'
        />

        <div className='grid gap-4 md:grid-cols-3'>
          <StatCard
            label='Title Issues'
            count={titleTotal}
            prevCount={prevSumFields(titleRows)}
            pct={
              totalPages > 0 ? Math.round((titleTotal / totalPages) * 100) : 0
            }
            color={severityConfig.critical.text}
            barColor={severityConfig.critical.bar}
          />
          <StatCard
            label='Description Issues'
            count={descTotal}
            prevCount={prevSumFields(descriptionRows)}
            pct={
              totalPages > 0 ? Math.round((descTotal / totalPages) * 100) : 0
            }
            color={severityConfig.warning.text}
            barColor={severityConfig.warning.bar}
          />
          <StatCard
            label='Heading Issues'
            count={headingTotal}
            prevCount={prevSumFields(headingRows)}
            pct={
              totalPages > 0 ? Math.round((headingTotal / totalPages) * 100) : 0
            }
            color={severityConfig.opportunity.text}
            barColor={severityConfig.opportunity.bar}
          />
        </div>

        <IssueList
          rows={titleRows}
          title='Title Tags'
          description='Page title optimization'
          cid={cid}
          val={val}
          prevVal={prevVal}
          totalPages={totalPages}
        />
        <IssueList
          rows={descriptionRows}
          title='Meta Descriptions'
          description='Description tag optimization'
          cid={cid}
          val={val}
          prevVal={prevVal}
          totalPages={totalPages}
        />
        <IssueList
          rows={headingRows}
          title='Headings'
          description='H1–H6 heading structure'
          cid={cid}
          val={val}
          prevVal={prevVal}
          totalPages={totalPages}
        />
      </div>
    </PageContainer>
  );
}

function IssueList({
  rows,
  title,
  description,
  cid,
  val,
  prevVal,
  totalPages
}: {
  rows: IssueRow[];
  title: string;
  description: string;
  cid: number;
  val: (field: string) => number;
  prevVal: (field: string) => number | null;
  totalPages: number;
}) {
  const visibleRows = rows.filter(
    (r) =>
      val(r.field) > 0 || r.severity === 'critical' || r.severity === 'warning'
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
                    {cfg.label}
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

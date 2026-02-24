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
import { AreaGraphStatusCodes } from '@/features/overview/components/area-graph-status-codes';

interface StatusRow {
  field: string;
  label: string;
}

const rows3xx: StatusRow[] = [
  { field: 'pages_301_permanent', label: '301 Permanent Redirect' },
  { field: 'pages_302_temporary', label: '302 Temporary Redirect' },
  { field: 'pages_303_see_other', label: '303 See Other' },
  { field: 'pages_307_temporary', label: '307 Temporary Redirect' },
  { field: 'pages_308_permanent', label: '308 Permanent Redirect' },
  { field: 'pages_3xx_other', label: '3xx Other' }
];

const rows4xx: StatusRow[] = [
  { field: 'pages_401_unauthorized', label: '401 Unauthorized' },
  { field: 'pages_403_forbidden', label: '403 Forbidden' },
  { field: 'pages_404_not_found', label: '404 Not Found' },
  { field: 'pages_405_method_not_allowed', label: '405 Method Not Allowed' },
  { field: 'pages_408_timeout', label: '408 Timeout' },
  { field: 'pages_410_gone', label: '410 Gone' },
  { field: 'pages_429_rate_limited', label: '429 Rate Limited' },
  { field: 'pages_4xx_other', label: '4xx Other' }
];

const rows5xx: StatusRow[] = [
  { field: 'pages_500_internal_error', label: '500 Internal Error' },
  { field: 'pages_502_bad_gateway', label: '502 Bad Gateway' },
  { field: 'pages_503_unavailable', label: '503 Unavailable' },
  { field: 'pages_504_timeout', label: '504 Timeout' },
  { field: 'pages_5xx_other', label: '5xx Other' }
];

export default async function StatusCodesReportPage({
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

  const totalPages =
    val('pages_200_response') +
    val('pages_3xx_response') +
    val('pages_4xx_response') +
    val('pages_5xx_response');

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

  const overviewCards: {
    label: string;
    field: string;
    color: string;
    barColor: string;
    invertDelta?: boolean;
  }[] = [
    {
      label: '2xx Success',
      field: 'pages_200_response',
      color: 'text-emerald-600 dark:text-emerald-400',
      barColor: '[&_[data-slot=progress-indicator]]:bg-emerald-500',
      invertDelta: true
    },
    {
      label: '3xx Redirects',
      field: 'pages_3xx_response',
      color: 'text-amber-600 dark:text-amber-400',
      barColor: '[&_[data-slot=progress-indicator]]:bg-amber-500'
    },
    {
      label: '4xx Client Errors',
      field: 'pages_4xx_response',
      color: 'text-orange-600 dark:text-orange-400',
      barColor: '[&_[data-slot=progress-indicator]]:bg-orange-500'
    },
    {
      label: '5xx Server Errors',
      field: 'pages_5xx_response',
      color: 'text-red-600 dark:text-red-400',
      barColor: '[&_[data-slot=progress-indicator]]:bg-red-500'
    }
  ];

  function DetailTable({
    title,
    description,
    rows,
    accentColor
  }: {
    title: string;
    description: string;
    rows: StatusRow[];
    accentColor: string;
  }) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-1'>
            {rows.map((r) => {
              const count = val(r.field);
              const p = prevVal(r.field);
              return (
                <Link
                  key={r.field}
                  href={`/dashboard/${cid}/audits/issues/${r.field.replace(/_/g, '-')}`}
                  className='hover:bg-muted/50 flex items-center justify-between rounded-md px-3 py-2.5 text-sm transition-colors'
                >
                  <span className='font-medium'>{r.label}</span>
                  <div className='flex items-center gap-3'>
                    <span
                      className={`text-lg font-bold tabular-nums ${count > 0 ? accentColor : 'text-muted-foreground'}`}
                    >
                      {count}
                    </span>
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
          title='Status Codes'
          description='HTTP response code distribution and trends'
        />

        {/* Overview cards */}
        <div className='grid gap-4 md:grid-cols-4'>
          {overviewCards.map((c) => {
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
                    <span className='text-muted-foreground text-xs'>
                      {pct}%
                    </span>
                    <DeltaBadge
                      current={count}
                      previous={p}
                      invertColor={c.invertDelta}
                    />
                  </div>
                  <Progress value={pct} className={`h-1.5 ${c.barColor}`} />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Status code trends chart */}
        <AreaGraphStatusCodes />

        {/* Detail tables */}
        <div className='grid gap-4 md:grid-cols-3'>
          <DetailTable
            title='3xx Redirects'
            description='Redirect response breakdown'
            rows={rows3xx}
            accentColor='text-amber-600 dark:text-amber-400'
          />
          <DetailTable
            title='4xx Client Errors'
            description='Client error response breakdown'
            rows={rows4xx}
            accentColor='text-orange-600 dark:text-orange-400'
          />
          <DetailTable
            title='5xx Server Errors'
            description='Server error response breakdown'
            rows={rows5xx}
            accentColor='text-red-600 dark:text-red-400'
          />
        </div>
      </div>
    </PageContainer>
  );
}

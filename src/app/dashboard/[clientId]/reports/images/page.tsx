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

export default async function ImagesReportPage({
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

  const totalImages = val('total_images');
  const issueTotal =
    val('total_images_missing_alt') +
    val('total_images_empty_alt') +
    val('total_images_missing_dimensions') +
    val('total_images_unoptimized_format');
  const prevIssueTotal = prev
    ? (prevVal('total_images_missing_alt') ?? 0) +
      (prevVal('total_images_empty_alt') ?? 0) +
      (prevVal('total_images_missing_dimensions') ?? 0) +
      (prevVal('total_images_unoptimized_format') ?? 0)
    : null;

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

  interface ImageIssue {
    totalField: string;
    pagesField: string;
    label: string;
    color: string;
    barColor: string;
  }

  const accessibilityIssues: ImageIssue[] = [
    {
      totalField: 'total_images_missing_alt',
      pagesField: 'pages_with_images_missing_alt',
      label: 'Missing Alt Text',
      color: 'text-red-600 dark:text-red-400',
      barColor: '[&_[data-slot=progress-indicator]]:bg-red-500'
    },
    {
      totalField: 'total_images_empty_alt',
      pagesField: 'pages_with_images_empty_alt',
      label: 'Empty Alt Text',
      color: 'text-amber-600 dark:text-amber-400',
      barColor: '[&_[data-slot=progress-indicator]]:bg-amber-500'
    }
  ];

  const performanceIssues: ImageIssue[] = [
    {
      totalField: 'total_images_missing_dimensions',
      pagesField: 'pages_with_images_missing_dimensions',
      label: 'Missing Dimensions',
      color: 'text-amber-600 dark:text-amber-400',
      barColor: '[&_[data-slot=progress-indicator]]:bg-amber-500'
    },
    {
      totalField: 'total_images_unoptimized_format',
      pagesField: 'pages_with_unoptimized_image_format',
      label: 'Unoptimised Format',
      color: 'text-sky-600 dark:text-sky-400',
      barColor: '[&_[data-slot=progress-indicator]]:bg-sky-500'
    }
  ];

  function ImageIssueCard({
    title,
    description,
    issues
  }: {
    title: string;
    description: string;
    issues: ImageIssue[];
  }) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {issues.map((issue) => {
            const count = val(issue.totalField);
            const pagesCount = val(issue.pagesField);
            const p = prevVal(issue.totalField);
            const pct =
              totalImages > 0 ? Math.round((count / totalImages) * 100) : 0;
            return (
              <div key={issue.totalField}>
                <Link
                  href={`/dashboard/${cid}/audits/issues/${issue.totalField.replace(/_/g, '-')}`}
                  className='group'
                >
                  <div className='mb-2 flex items-center justify-between'>
                    <span className='font-medium group-hover:underline'>
                      {issue.label}
                    </span>
                    <div className='flex items-center gap-2'>
                      <span
                        className={`text-lg font-bold tabular-nums ${issue.color}`}
                      >
                        {count}
                      </span>
                      <DeltaBadge current={count} previous={p} />
                    </div>
                  </div>
                </Link>
                <Progress value={pct} className={`h-2 ${issue.barColor}`} />
                <p className='text-muted-foreground mt-1 text-xs'>
                  {pagesCount} pages affected · {pct}% of images
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  }

  const issuePct =
    totalImages > 0 ? Math.round((issueTotal / totalImages) * 100) : 0;
  const issueBarColor =
    issuePct >= 30
      ? '[&_[data-slot=progress-indicator]]:bg-red-500'
      : issuePct >= 10
        ? '[&_[data-slot=progress-indicator]]:bg-amber-500'
        : '[&_[data-slot=progress-indicator]]:bg-sky-500';
  const issueTextColor =
    issuePct >= 30
      ? 'text-red-600 dark:text-red-400'
      : issuePct >= 10
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-sky-600 dark:text-sky-400';

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col gap-6'>
        <Heading
          title='Image Optimization'
          description='Image accessibility and performance audit'
        />

        {/* Summary cards */}
        <div className='grid gap-4 md:grid-cols-2'>
          <Card>
            <CardContent className='flex flex-col gap-2 py-4'>
              <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                Total Images
              </p>
              <div className='flex items-baseline gap-2'>
                <span className='text-2xl font-bold tabular-nums'>
                  {totalImages}
                </span>
                <DeltaBadge
                  current={totalImages}
                  previous={prevVal('total_images')}
                  invertColor
                />
              </div>
              <Progress
                value={100}
                className='h-1.5 [&_[data-slot=progress-indicator]]:bg-blue-500'
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className='flex flex-col gap-2 py-4'>
              <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                Images with Issues
              </p>
              <div className='flex items-baseline gap-2'>
                <span
                  className={`text-2xl font-bold tabular-nums ${issueTextColor}`}
                >
                  {issueTotal}
                </span>
                <span className='text-muted-foreground text-xs'>
                  {issuePct}%
                </span>
                <DeltaBadge current={issueTotal} previous={prevIssueTotal} />
              </div>
              <Progress value={issuePct} className={`h-1.5 ${issueBarColor}`} />
            </CardContent>
          </Card>
        </div>

        {/* Detail cards */}
        <div className='grid gap-4 md:grid-cols-2'>
          <ImageIssueCard
            title='Accessibility'
            description='Alt text coverage for screen readers'
            issues={accessibilityIssues}
          />
          <ImageIssueCard
            title='Performance'
            description='Image optimization opportunities'
            issues={performanceIssues}
          />
        </div>
      </div>
    </PageContainer>
  );
}

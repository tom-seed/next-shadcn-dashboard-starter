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
import { Progress } from '@/components/ui/progress';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { StatCard } from '@/components/ui/stat-card';
import { DeltaBadge } from '@/components/ui/delta-badge';
import { ensureClientAccess } from '@/lib/auth/memberships';
import { getClientOverviewData } from '@/features/overview/lib/get-client-overview-data';

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

  const audit = latest as Record<string, unknown>;
  const prev = (previous as Record<string, unknown>) ?? null;

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

        <div className='grid gap-4 md:grid-cols-2'>
          <StatCard
            label='Total Images'
            count={totalImages}
            prevCount={prevVal('total_images')}
            color=''
            barColor='[&_[data-slot=progress-indicator]]:bg-blue-500'
            invertDelta
          />
          <StatCard
            label='Images with Issues'
            count={issueTotal}
            prevCount={prevIssueTotal}
            pct={issuePct}
            color={issueTextColor}
            barColor={issueBarColor}
          />
        </div>

        <div className='grid gap-4 md:grid-cols-2'>
          <ImageIssueCard
            title='Accessibility'
            description='Alt text coverage for screen readers'
            issues={accessibilityIssues}
            cid={cid}
            val={val}
            prevVal={prevVal}
            totalImages={totalImages}
          />
          <ImageIssueCard
            title='Performance'
            description='Image optimization opportunities'
            issues={performanceIssues}
            cid={cid}
            val={val}
            prevVal={prevVal}
            totalImages={totalImages}
          />
        </div>
      </div>
    </PageContainer>
  );
}

function ImageIssueCard({
  title,
  description,
  issues,
  cid,
  val,
  prevVal,
  totalImages
}: {
  title: string;
  description: string;
  issues: ImageIssue[];
  cid: number;
  val: (field: string) => number;
  prevVal: (field: string) => number | null;
  totalImages: number;
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

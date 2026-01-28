import { getUrlById } from '@/lib/api/urls';
import { notFound } from 'next/navigation';
import { Heading } from '@/components/ui/heading';
import {
  IconAlertTriangle,
  IconLink,
  IconCheck,
  IconInfoCircle,
  IconArrowLeft
} from '@tabler/icons-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskCreateDialog } from '@/features/tasks/task-create-dialog';
import { Button } from '@/components/ui/button';

interface UrlViewPageProps {
  clientId: string;
  urlId: string;
}

const ellipsisUrl = (url: string) =>
  url.length > 100 ? `${url.slice(0, 100)}...` : url;

type Severity = 'Alert' | 'Warning' | 'Opportunity';
const getSeverity = (key: string): Severity => {
  if (/pages_5xx_response|pages_4xx_response/.test(key)) return 'Alert';
  if (/pages_3xx_response/.test(key)) return 'Warning';
  if (/pages_missing_(title|description)/.test(key)) return 'Alert';
  if (/pages_multiple_(title|description)/.test(key)) return 'Alert';
  if (/pages_duplicate_(title|description)/.test(key)) return 'Opportunity';
  if (/too_short_|too_long_|under_|over_/.test(key)) return 'Opportunity';
  if (/pages_missing_h1|pages_missing_h2/.test(key)) return 'Alert';
  if (/pages_multiple_h1|with_multiple_h2s/.test(key)) return 'Warning';
  if (/pages_duplicate_h1|pages_duplicate_h2/.test(key)) return 'Warning';
  if (/pages_missing_h[3-6]/.test(key)) return 'Warning';
  return 'Warning';
};

const prettyIssue = (key: string) =>
  key
    .replace(/^pages_/, '')
    .replace(/_/g, ' ')
    .replace(/\bwith\b\s*/i, '')
    .replace(/\bh(\d)\b/gi, (_, n) => `H${n}`)
    .replace(/\b\w/g, (c) => c.toUpperCase());

function StatusBadge({ code }: { code: number }) {
  const variant =
    code >= 200 && code < 300
      ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
      : code >= 300 && code < 400
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
        : code >= 400 && code < 500
          ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
          : code >= 500
            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
            : '';

  return (
    <Badge variant='outline' className={`border-transparent ${variant}`}>
      {code}
    </Badge>
  );
}

const severityConfig: Record<
  Severity,
  { icon: typeof IconAlertTriangle; color: string; label: string }
> = {
  Alert: { icon: IconAlertTriangle, color: 'text-red-500', label: 'Critical' },
  Warning: { icon: IconInfoCircle, color: 'text-amber-500', label: 'Warning' },
  Opportunity: {
    icon: IconCheck,
    color: 'text-sky-500',
    label: 'Opportunity'
  }
};

const normalizeHeadings = (arr?: string[]) =>
  (arr ?? []).map((s) => (s ?? '').trim()).filter(Boolean);

export default async function UrlViewPage({
  clientId,
  urlId
}: UrlViewPageProps) {
  const url = await getUrlById(clientId, urlId);
  if (!url) return notFound();
  const fullUrl = url.url;

  const issues = (url.auditIssues ?? []).filter(
    (issue) => issue.issueKey !== 'pages_200_response'
  );
  const grouped: Record<Severity, typeof issues> = {
    Alert: issues.filter((i) => getSeverity(i.issueKey) === 'Alert'),
    Warning: issues.filter((i) => getSeverity(i.issueKey) === 'Warning'),
    Opportunity: issues.filter((i) => getSeverity(i.issueKey) === 'Opportunity')
  };

  const currentCrawlId = url.crawlId ?? null;
  const outlinks = (url.sourceLinks ?? []).filter((link) =>
    currentCrawlId ? link.crawlId === currentCrawlId : true
  );
  const inlinks = (url.targetLinks ?? []).filter((link) =>
    currentCrawlId ? link.crawlId === currentCrawlId : true
  );

  const cid = parseInt(clientId);

  return (
    <div className='flex flex-1 flex-col gap-6'>
      {/* Header */}
      <div className='flex flex-col gap-4'>
        <Button variant='ghost' size='sm' className='w-fit' asChild>
          <Link href={`/dashboard/${cid}/urls`}>
            <IconArrowLeft className='mr-1 h-4 w-4' />
            Back to URLs
          </Link>
        </Button>

        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='min-w-0 flex-1 space-y-1'>
            <Heading
              title='URL Details'
              description='Inspect content, issues and internal links for this page.'
            />
            <div className='flex items-center gap-2'>
              <span className='text-muted-foreground max-w-[70vw] truncate text-sm md:max-w-[50vw] xl:max-w-[40vw]'>
                {fullUrl}
              </span>
              {fullUrl && (
                <Link
                  href={fullUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label='Open URL in new tab'
                >
                  <IconLink className='text-muted-foreground hover:text-foreground h-4 w-4' />
                </Link>
              )}
            </div>
            <div className='flex items-center gap-3 pt-1'>
              <StatusBadge code={url.status ?? 0} />
              <TaskCreateDialog
                clientId={cid}
                urlId={parseInt(urlId)}
                defaultTitle={`Fix issue on ${ellipsisUrl(fullUrl)}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* Left: Content & Links */}
        <div className='space-y-6 lg:col-span-2'>
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent className='space-y-5'>
              <div className='grid gap-4 md:grid-cols-2'>
                <div className='space-y-1'>
                  <span className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                    Meta Title
                  </span>
                  <p className='text-sm break-words'>
                    {url.metaTitle || (
                      <span className='text-muted-foreground'>Not set</span>
                    )}
                  </p>
                </div>
                <div className='space-y-1'>
                  <span className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                    Canonical
                  </span>
                  <p className='text-sm break-all'>
                    {url.canonical || (
                      <span className='text-muted-foreground'>Not set</span>
                    )}
                  </p>
                </div>
              </div>
              <div className='space-y-1'>
                <span className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                  Meta Description
                </span>
                <p className='text-sm'>
                  {url.metaDescription || (
                    <span className='text-muted-foreground'>Not set</span>
                  )}
                </p>
              </div>

              <div className='border-t pt-5'>
                <div className='grid gap-4 md:grid-cols-2'>
                  <div>
                    <span className='text-muted-foreground mb-2 block text-xs font-medium tracking-wide uppercase'>
                      H1 Tags
                    </span>
                    {normalizeHeadings(url.h1).length ? (
                      <ul className='space-y-1.5'>
                        {normalizeHeadings(url.h1).map((heading, idx) => (
                          <li key={`${heading}-${idx}`}>
                            <Badge
                              variant='secondary'
                              className='break-words whitespace-normal'
                            >
                              {heading}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className='text-muted-foreground text-sm'>None</p>
                    )}
                  </div>
                  <div>
                    <span className='text-muted-foreground mb-2 block text-xs font-medium tracking-wide uppercase'>
                      H2 Tags
                    </span>
                    {normalizeHeadings(url.h2).length ? (
                      <ul className='space-y-1.5'>
                        {normalizeHeadings(url.h2).map((heading, idx) => (
                          <li key={`${heading}-${idx}`}>
                            <Badge
                              variant='outline'
                              className='break-words whitespace-normal'
                            >
                              {heading}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className='text-muted-foreground text-sm'>None</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Links</CardTitle>
              <CardDescription>Internal linking structure</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue='outlinks' className='w-full'>
                <TabsList className='grid w-full grid-cols-2'>
                  <TabsTrigger value='outlinks'>
                    Outlinks ({outlinks.length})
                  </TabsTrigger>
                  <TabsTrigger value='inlinks'>
                    Inlinks ({inlinks.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value='outlinks' className='mt-4'>
                  {outlinks.length ? (
                    <div className='max-h-80 space-y-0 overflow-y-auto rounded-md border'>
                      {outlinks.map((link) => {
                        const targetUrl = link.target?.url ?? link.targetUrl;
                        const status =
                          link.target?.status ?? link.status ?? null;
                        const relLabel = !link.follow ? 'nofollow' : 'follow';
                        return (
                          <div
                            key={link.id}
                            className='flex items-center justify-between gap-3 border-b px-3 py-2 last:border-none'
                          >
                            <div className='min-w-0 flex-1'>
                              <p className='truncate text-sm font-medium'>
                                {targetUrl}
                              </p>
                              <p className='text-muted-foreground text-xs'>
                                {link.anchor
                                  ? `Anchor: ${link.anchor}`
                                  : 'No anchor'}
                                {' · '}
                                {relLabel}
                                {link.rel ? ` · rel="${link.rel}"` : ''}
                              </p>
                            </div>
                            <div className='flex shrink-0 items-center gap-2'>
                              {status ? <StatusBadge code={status} /> : null}
                              <Link
                                href={targetUrl}
                                target='_blank'
                                rel='noopener noreferrer'
                                aria-label='Open outlink in new tab'
                              >
                                <IconLink className='text-muted-foreground hover:text-foreground h-4 w-4' />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className='text-muted-foreground py-8 text-center text-sm'>
                      No internal outlinks found
                    </p>
                  )}
                </TabsContent>
                <TabsContent value='inlinks' className='mt-4'>
                  {inlinks.length ? (
                    <div className='max-h-80 space-y-0 overflow-y-auto rounded-md border'>
                      {inlinks.map((link) => {
                        const sourceUrl = link.source?.url ?? 'Unknown source';
                        const status =
                          link.source?.status ?? link.status ?? null;
                        const relLabel = !link.follow ? 'nofollow' : 'follow';
                        return (
                          <div
                            key={link.id}
                            className='flex items-center justify-between gap-3 border-b px-3 py-2 last:border-none'
                          >
                            <div className='min-w-0 flex-1'>
                              <p className='truncate text-sm font-medium'>
                                {sourceUrl}
                              </p>
                              <p className='text-muted-foreground text-xs'>
                                {link.anchor
                                  ? `Anchor: ${link.anchor}`
                                  : 'No anchor'}
                                {' · '}
                                {relLabel}
                                {link.rel ? ` · rel="${link.rel}"` : ''}
                              </p>
                            </div>
                            <div className='flex shrink-0 items-center gap-2'>
                              {status ? <StatusBadge code={status} /> : null}
                              <Link
                                href={sourceUrl}
                                target='_blank'
                                rel='noopener noreferrer'
                                aria-label='Open inlinking page in new tab'
                              >
                                <IconLink className='text-muted-foreground hover:text-foreground h-4 w-4' />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className='text-muted-foreground py-8 text-center text-sm'>
                      No internal inlinks found
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right: Issues */}
        <div className='lg:col-span-1'>
          <Card className='h-full'>
            <CardHeader>
              <CardTitle>Issues</CardTitle>
              <CardDescription>
                {issues.length
                  ? `${issues.length} issue${issues.length === 1 ? '' : 's'} detected`
                  : 'No issues detected'}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-5'>
              {(['Alert', 'Warning', 'Opportunity'] as Severity[]).map(
                (severity) => {
                  const config = severityConfig[severity];
                  const Icon = config.icon;
                  const items = grouped[severity];
                  return (
                    <div key={severity}>
                      <h4 className='mb-2 flex items-center gap-2 text-sm font-semibold'>
                        <Icon className={`h-4 w-4 ${config.color}`} />
                        {config.label} ({items.length})
                      </h4>
                      {items.length ? (
                        <ul className='space-y-1.5'>
                          {items.map((issue) => (
                            <li
                              key={issue.id}
                              className='flex items-center gap-2 rounded-md border px-3 py-2 text-sm'
                            >
                              <Icon
                                className={`h-3.5 w-3.5 shrink-0 ${config.color}`}
                              />
                              <span>{prettyIssue(issue.issueKey)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className='text-muted-foreground text-xs'>
                          No {config.label.toLowerCase()}s.
                        </p>
                      )}
                    </div>
                  );
                }
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

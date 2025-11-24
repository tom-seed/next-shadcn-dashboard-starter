import { getUrlById } from '@/lib/api/urls';
import { notFound } from 'next/navigation';
import { Heading } from '@/components/ui/heading';
import {
  IconAlertTriangle,
  IconLink,
  IconCheck,
  IconInfoCircle
} from '@tabler/icons-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import PageContainer from '@/components/layout/page-container';
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

const issueMap = (key: string, issue: string) => {
  const cleaned = issue
    .replace(/^pages_/, '')
    .replaceAll('_', ' ')
    .replace(/\bWith\b\s*/i, '')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const severity = getSeverity(key);

  const iconClass =
    severity === 'Alert'
      ? 'text-red-500'
      : severity === 'Warning'
        ? 'text-orange-500'
        : 'text-blue-500';

  const Icon =
    severity === 'Alert'
      ? IconAlertTriangle
      : severity === 'Warning'
        ? IconInfoCircle
        : IconCheck;

  return (
    <div className='flex items-center gap-2 rounded-md border p-2 text-sm'>
      <Icon className={`h-4 w-4 ${iconClass}`} />
      <span>{cleaned}</span>
    </div>
  );
};

const statusCodeBadge = (statusCode: number) => {
  let className = 'bg-muted text-white px-2 py-1 rounded-full font-medium';

  if (statusCode === 200) {
    className = 'bg-green-500 text-white px-2 py-1 rounded-full font-medium';
  } else if (statusCode === 301) {
    className = 'bg-yellow-500 text-white px-2 py-1 rounded-full font-medium';
  } else if (statusCode === 404) {
    className = 'bg-red-500 text-white px-2 py-1 rounded-full font-medium';
  } else if (statusCode >= 500 && statusCode < 600) {
    className = 'bg-muted text-white px-2 py-1 rounded-full font-medium';
  }

  return (
    <span className='flex items-center gap-1'>
      <Badge className={className}>{statusCode}</Badge>
    </span>
  );
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
  const alerts = issues.filter(
    (issue) => getSeverity(issue.issueKey) === 'Alert'
  );
  const warnings = issues.filter(
    (issue) => getSeverity(issue.issueKey) === 'Warning'
  );
  const opportunities = issues.filter(
    (issue) => getSeverity(issue.issueKey) === 'Opportunity'
  );

  const currentCrawlId = url.crawlId ?? null;
  const outlinks = (url.sourceLinks ?? []).filter((link) =>
    currentCrawlId ? link.crawlId === currentCrawlId : true
  );
  const inlinks = (url.targetLinks ?? []).filter((link) =>
    currentCrawlId ? link.crawlId === currentCrawlId : true
  );

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <div className='flex flex-col gap-1'>
            <Heading
              title='URL Details'
              description='View details for a specific URL'
            />
            <div className='text-muted-foreground mb-2 flex items-center gap-2 text-sm'>
              <span className='max-w-[70vw] truncate md:max-w-[50vw] xl:max-w-[40vw]'>
                {ellipsisUrl(fullUrl)}
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
            <div className='flex items-center gap-2'>
              <span className='text-muted-foreground text-sm'>Status</span>
              {statusCodeBadge(url.status ?? 0)}
            </div>
          </div>
        </div>
        <TaskCreateDialog
          clientId={parseInt(clientId)}
          urlId={parseInt(urlId)}
          defaultTitle={`Fix issue on ${ellipsisUrl(fullUrl)}`}
        />
      </div>
      <Separator />

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
        {/* Left Column: Content & Metadata */}
        <div className='space-y-4 lg:col-span-2'>
          <Card>
            <CardHeader>
              <CardTitle>Content Overview</CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='grid gap-4 md:grid-cols-2'>
                <div className='space-y-1'>
                  <span className='text-muted-foreground text-sm font-medium'>
                    Meta Title
                  </span>
                  <div className='text-sm font-medium break-words'>
                    {url.metaTitle || 'N/A'}
                  </div>
                </div>
                <div className='space-y-1'>
                  <span className='text-muted-foreground text-sm font-medium'>
                    Canonical
                  </span>
                  <div className='text-sm font-medium break-all'>
                    {url.canonical || 'N/A'}
                  </div>
                </div>
              </div>
              <div className='space-y-1'>
                <span className='text-muted-foreground text-sm font-medium'>
                  Meta Description
                </span>
                <div className='text-muted-foreground text-sm'>
                  {url.metaDescription || 'N/A'}
                </div>
              </div>

              <Separator />

              <div className='grid gap-4 md:grid-cols-2'>
                <div>
                  <span className='mb-2 block text-sm font-medium'>
                    H1 Tags
                  </span>
                  {normalizeHeadings(url.h1).length ? (
                    <ul className='space-y-2'>
                      {normalizeHeadings(url.h1).map((heading, idx) => (
                        <li key={`${heading}-${idx}`} className='text-sm'>
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
                    <div className='text-muted-foreground text-sm'>
                      No H1 Tags Found
                    </div>
                  )}
                </div>
                <div>
                  <span className='mb-2 block text-sm font-medium'>
                    H2 Tags
                  </span>
                  {normalizeHeadings(url.h2).length ? (
                    <ul className='space-y-2'>
                      {normalizeHeadings(url.h2).map((heading, idx) => (
                        <li key={`${heading}-${idx}`} className='text-sm'>
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
                    <div className='text-muted-foreground text-sm'>
                      No H2 Tags Found
                    </div>
                  )}
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
                    <div className='bg-muted/30 grid max-h-60 grid-cols-1 gap-2 overflow-y-auto rounded-md border p-3'>
                      {outlinks.map((link) => {
                        const targetUrl = link.target?.url ?? link.targetUrl;
                        const status =
                          link.target?.status ?? link.status ?? null;
                        const relLabel = !link.follow ? 'nofollow' : 'follow';
                        return (
                          <div
                            key={link.id}
                            className='flex items-start justify-between gap-3 border-b pb-2 last:border-none'
                          >
                            <div className='flex flex-1 flex-col gap-1'>
                              <span className='text-foreground text-sm font-medium break-all'>
                                {ellipsisUrl(targetUrl)}
                              </span>
                              <div className='text-muted-foreground text-xs'>
                                {link.anchor
                                  ? `Anchor: ${link.anchor}`
                                  : 'Anchor: —'}
                              </div>
                              <div className='text-muted-foreground text-xs'>
                                {relLabel}
                                {link.rel ? ` · rel="${link.rel}"` : ''}
                              </div>
                            </div>
                            <div className='flex shrink-0 flex-col items-end gap-2'>
                              {status ? statusCodeBadge(status) : null}
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
                    <div className='text-muted-foreground py-8 text-center text-sm'>
                      No internal outlinks found
                    </div>
                  )}
                </TabsContent>
                <TabsContent value='inlinks' className='mt-4'>
                  {inlinks.length ? (
                    <div className='bg-muted/30 grid max-h-60 grid-cols-1 gap-2 overflow-y-auto rounded-md border p-3'>
                      {inlinks.map((link) => {
                        const sourceUrl = link.source?.url ?? 'Unknown source';
                        const status =
                          link.source?.status ?? link.status ?? null;
                        const relLabel = !link.follow ? 'nofollow' : 'follow';
                        return (
                          <div
                            key={link.id}
                            className='flex items-start justify-between gap-3 border-b pb-2 last:border-none'
                          >
                            <div className='flex flex-1 flex-col gap-1'>
                              <span className='text-foreground text-sm font-medium break-all'>
                                {ellipsisUrl(sourceUrl)}
                              </span>
                              <div className='text-muted-foreground text-xs'>
                                {link.anchor
                                  ? `Anchor: ${link.anchor}`
                                  : 'Anchor: —'}
                              </div>
                              <div className='text-muted-foreground text-xs'>
                                {relLabel}
                                {link.rel ? ` · rel="${link.rel}"` : ''}
                              </div>
                            </div>
                            <div className='flex shrink-0 flex-col items-end gap-2'>
                              {status ? statusCodeBadge(status) : null}
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
                    <div className='text-muted-foreground py-8 text-center text-sm'>
                      No internal inlinks found
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Issues */}
        <div className='lg:col-span-1'>
          <Card className='h-full'>
            <CardHeader>
              <CardTitle>Issues Detected</CardTitle>
              <CardDescription>
                {issues.length} total issues found
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div>
                <h4 className='mb-2 flex items-center gap-2 text-sm font-semibold'>
                  <IconAlertTriangle className='h-4 w-4 text-red-500' />
                  Critical Alerts ({alerts.length})
                </h4>
                {alerts.length ? (
                  <div className='space-y-2'>
                    {alerts.map((issue, idx) => (
                      <div key={idx}>
                        {issueMap(issue.issueKey, issue.issueKey)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className='text-muted-foreground text-xs'>
                    No critical alerts.
                  </p>
                )}
              </div>

              <Separator />

              <div>
                <h4 className='mb-2 flex items-center gap-2 text-sm font-semibold'>
                  <IconInfoCircle className='h-4 w-4 text-orange-500' />
                  Warnings ({warnings.length})
                </h4>
                {warnings.length ? (
                  <div className='space-y-2'>
                    {warnings.map((issue, idx) => (
                      <div key={idx}>
                        {issueMap(issue.issueKey, issue.issueKey)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className='text-muted-foreground text-xs'>No warnings.</p>
                )}
              </div>

              <Separator />

              <div>
                <h4 className='mb-2 flex items-center gap-2 text-sm font-semibold'>
                  <IconCheck className='h-4 w-4 text-blue-500' />
                  Opportunities ({opportunities.length})
                </h4>
                {opportunities.length ? (
                  <div className='space-y-2'>
                    {opportunities.map((issue, idx) => (
                      <div key={idx}>
                        {issueMap(issue.issueKey, issue.issueKey)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className='text-muted-foreground text-xs'>
                    No opportunities.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

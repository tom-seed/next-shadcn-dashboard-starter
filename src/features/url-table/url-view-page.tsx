import { getUrlById } from '@/lib/api/urls';
import { notFound } from 'next/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Heading } from '@/components/ui/heading';
import { IconAlertTriangle, IconLink } from '@tabler/icons-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import PageContainer from '@/components/layout/page-container';
import { Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface UrlViewPageProps {
  clientId: string;
  urlId: string;
}

const ellipsisUrl = (url: string) =>
  url.length > 100 ? url.slice(0, 100) + '...' : url;

// Severity helpers
type Severity = 'Alert' | 'Warning' | 'Opportunity';
const getSeverity = (key: string): Severity => {
  // Response Codes
  if (/pages_5xx_response|pages_4xx_response/.test(key)) return 'Alert';
  if (/pages_3xx_response/.test(key)) return 'Warning';

  // Meta Data (titles/descriptions)
  if (/pages_missing_(title|description)/.test(key)) return 'Alert';
  if (/pages_multiple_(title|description)/.test(key)) return 'Alert';
  if (/pages_duplicate_(title|description)/.test(key)) return 'Opportunity';
  if (/too_short_|too_long_|under_|over_/.test(key)) return 'Opportunity';

  // Headings (H1/H2)
  if (/pages_missing_h1|pages_missing_h2/.test(key)) return 'Alert';
  if (/pages_multiple_h1|with_multiple_h2s/.test(key)) return 'Warning';
  if (/pages_duplicate_h1|pages_duplicate_h2/.test(key)) return 'Warning';

  // Other headings (H3+): treat as Warning by default
  if (/pages_missing_h[3-6]/.test(key)) return 'Warning';

  return 'Warning';
};

const issueMap = (key: string, issue: string) => {
  const issueClean = issue
    .replace(/^pages_/, '')
    .replaceAll('_', ' ')
    .replace(/\bWith\b\s*/i, '')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const severity = getSeverity(key);
  if (severity === 'Alert') {
    return (
      <span className='flex items-center gap-1'>
        <IconAlertTriangle className='h-4 w-4 text-white' />
        {issueClean}
      </span>
    );
  }

  if (severity === 'Warning') {
    return (
      <span className='flex items-center gap-1'>
        <IconAlertTriangle className='h-4 w-4 text-yellow-500' />
        {issueClean}
      </span>
    );
  }

  if (severity === 'Opportunity') {
    return (
      <span className='flex items-center gap-1'>
        <IconAlertTriangle className='h-4 w-4 text-white' />
        {issueClean}
      </span>
    );
  }

  return null;
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

  // Filter out non-issues (e.g., 200 OK) and pre-group by severity for counts
  const issues = (url.auditIssues ?? []).filter(
    (i) => i.issueKey !== 'pages_200_response'
  );
  const alerts = issues.filter((i) => getSeverity(i.issueKey) === 'Alert');
  const warnings = issues.filter((i) => getSeverity(i.issueKey) === 'Warning');
  const opportunities = issues.filter(
    (i) => getSeverity(i.issueKey) === 'Opportunity'
  );
  const outlinks = url.internalLinks ?? [];
  const outlinksCount = outlinks.length;

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-4'>
        {/* Header */}
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
        <Separator />
        <div className='grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-3'>
          {/* Metadata Card */}
          <div className='col-span-2'>
            <div className='bg-card text-card-foreground flex h-full flex-col rounded-lg border shadow-sm'>
              <div className='border-b p-4 pb-2'>
                <span className='text-base font-semibold'>Metadata</span>
              </div>
              <div className='space-y-2 p-4'>
                <div>
                  <span className='text-sm font-medium'>Meta Title:</span>
                  <div className='text-muted-foreground text-sm'>
                    {url.metaTitle || 'N/A'}
                  </div>
                </div>
                <div>
                  <span className='text-sm font-medium'>Meta Description:</span>
                  <div className='text-muted-foreground text-sm'>
                    {url.metaDescription || 'N/A'}
                  </div>
                </div>
                <div>
                  <span className='text-sm font-medium'>Canonical:</span>
                  <div className='text-muted-foreground text-sm'>
                    {url.canonical || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Headings Card */}
          <div className='col-span-1'>
            <div className='bg-card text-card-foreground flex h-full flex-col rounded-lg border shadow-sm'>
              <div className='border-b p-4 pb-2'>
                <span className='text-base font-semibold'>Headings</span>
              </div>
              {/* Headings content */}
              <CardContent className='space-y-4'>
                <div>
                  <span className='text-sm font-medium'>H1 Tags</span>
                  {normalizeHeadings(url.h1).length ? (
                    <ul className='mt-2 space-y-2'>
                      {normalizeHeadings(url.h1).map((heading, idx) => (
                        <li key={`${heading}-${idx}`} className='text-sm'>
                          <Badge className='bg-blue-100 break-words whitespace-normal text-blue-800'>
                            {heading}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className='text-muted-foreground mt-2'>N/A</div>
                  )}
                </div>
                <div>
                  <span className='text-sm font-medium'>H2 Tags</span>
                  {normalizeHeadings(url.h2).length ? (
                    <ul className='mt-2 space-y-2'>
                      {normalizeHeadings(url.h2).map((heading, idx) => (
                        <li key={`${heading}-${idx}`} className='text-sm'>
                          <Badge className='bg-indigo-100 break-words whitespace-normal text-indigo-800'>
                            {heading}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className='text-muted-foreground mt-2'>N/A</div>
                  )}
                </div>
              </CardContent>
            </div>
          </div>

          {/* Issues: three cards */}
          <Card className='col-span-1'>
            <CardHeader>
              <CardTitle>Alerts ({alerts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length ? (
                <div className='flex flex-wrap gap-2'>
                  {alerts.map((issue, idx) => (
                    <Badge key={idx} variant='destructive'>
                      {issueMap(issue.issueKey, issue.issueKey) ??
                        issue.issueKey}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className='text-muted-foreground'>
                  No alerts detected
                </span>
              )}
            </CardContent>
          </Card>

          <Card className='col-span-1'>
            <CardHeader>
              <CardTitle>Warnings ({warnings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {warnings.length ? (
                <div className='flex flex-wrap gap-2'>
                  {warnings.map((issue, idx) => (
                    <Badge key={idx}>
                      {issueMap(issue.issueKey, issue.issueKey) ??
                        issue.issueKey}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className='text-muted-foreground'>
                  No warnings detected
                </span>
              )}
            </CardContent>
          </Card>

          <Card className='col-span-1'>
            <CardHeader>
              <CardTitle>Opportunities ({opportunities.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {opportunities.length ? (
                <div className='flex flex-wrap gap-2'>
                  {opportunities.map((issue, idx) => (
                    <Badge key={idx} variant='secondary'>
                      {issueMap(issue.issueKey, issue.issueKey) ??
                        issue.issueKey}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className='text-muted-foreground'>
                  No opportunities detected
                </span>
              )}
            </CardContent>
          </Card>
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-1'>
          <Card>
            <CardHeader className='flex flex-row items-center gap-2'>
              <CardTitle className='flex items-center gap-2'>
                Unique Outlinks ({outlinksCount})
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className='text-muted-foreground h-4 w-4 cursor-help' />
                    </TooltipTrigger>
                    <TooltipContent side='top' align='center' sideOffset={4}>
                      <p>
                        Unique outlinks going from this page to other pages on
                        the site
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {outlinksCount ? (
                <div className='bg-muted/30 grid max-h-60 grid-cols-1 gap-2 overflow-y-auto rounded-md border p-3'>
                  {outlinks.map((link) => (
                    <div
                      key={link}
                      className='flex items-center justify-between border-b pb-2 last:border-none'
                    >
                      <span className='text-muted-foreground text-sm'>
                        {ellipsisUrl(link)}
                      </span>
                      <Link
                        href={link}
                        target='_blank'
                        rel='noopener noreferrer'
                        aria-label='Open outlink in new tab'
                      >
                        <IconLink className='text-muted-foreground hover:text-foreground h-4 w-4' />
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <span className='text-muted-foreground'>No outlinks found</span>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

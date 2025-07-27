import { getUrlById } from '@/lib/api/urls';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface UrlViewPageProps {
  clientId: string;
  urlId: string;
}

const issueMap = {
  pages_missing_description: 'Missing Meta Description',
  too_short_description: 'Meta Description Too Short',
  pages_with_multiple_h2s: 'Multiple H2 Tags',
  pages_missing_h4: 'Missing H4 Tag',
  pages_missing_h5: 'Missing H5 Tag',
  pages_missing_h6: 'Missing H6 Tag'
};

export default async function UrlViewPage({
  clientId,
  urlId
}: UrlViewPageProps) {
  const url = await getUrlById(clientId, urlId);

  if (!url) return notFound();

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          URL Details
        </CardTitle>
      </CardHeader>

      <CardContent className='space-y-4'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <div>
            <span className='text-sm font-medium'>URL:</span>
            <p className='text-muted-foreground text-sm break-all'>{url.url}</p>
          </div>
          <div>
            <span className='text-sm font-medium'>Status:</span>
            <p className='text-muted-foreground'>{url.status ?? 'N/A'}</p>
          </div>
          <div>
            <span className='text-sm font-medium'>Meta Title:</span>
            <p className='text-muted-foreground'>{url.metaTitle || 'N/A'}</p>
          </div>
          <div>
            <span className='text-sm font-medium'>Meta Description:</span>
            <p className='text-muted-foreground'>
              {url.metaDescription || 'N/A'}
            </p>
          </div>
          <div className='md:col-span-2'>
            <span className='text-sm font-medium'>H1 Tags:</span>
            <ul className='text-muted-foreground ml-4 list-disc text-sm'>
              {(url.h1 ?? []).map((heading, idx) => (
                <li key={idx}>{heading}</li>
              ))}
              {(!url.h1 || url.h1.length === 0) && <li>N/A</li>}
            </ul>
          </div>
          <div>
            <span className='font-medium'>Issues:</span>
            {url.auditIssues?.length > 0 ? (
              <ul className='text-destructive list-inside list-disc'>
                {url.auditIssues.map((issue, idx) => (
                  <li key={idx}>
                    {issueMap[issue.issueKey as keyof typeof issueMap] ||
                      issue.issueKey}
                  </li>
                ))}
              </ul>
            ) : (
              <p className='text-muted-foreground'>None</p>
            )}
          </div>
        </div>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          {url.sourceLinks && url.sourceLinks.length > 0 && (
            <div>
              <div className='mt-6 mb-2 flex items-center gap-2'>
                <h3 className='text-lg font-semibold'>Outlinks</h3>
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
              </div>
              <div className='bg-muted/30 max-h-48 space-y-2 overflow-y-auto rounded-md border p-3'>
                {url.sourceLinks.map((link) => (
                  <div
                    key={link.id}
                    className='text-muted-foreground border-b pb-2 text-sm last:border-none'
                  >
                    <div className='font-medium'>
                      Page: {link.targetUrl ?? '(unknown)'}
                    </div>
                    <div>Status: {link.status ?? 'Unknown'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {url.targetLinks && url.targetLinks.length > 0 && (
            <div>
              <div className='mt-6 mb-2 flex items-center gap-2'>
                <h3 className='text-lg font-semibold'>Inlinks</h3>
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className='text-muted-foreground h-4 w-4 cursor-help' />
                    </TooltipTrigger>
                    <TooltipContent side='top' align='center' sideOffset={4}>
                      <p>
                        Unique inlinks coming into this page from other pages on
                        the site
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className='bg-muted/30 max-h-48 space-y-2 overflow-y-auto rounded-md border p-3'>
                {url.targetLinks.map((link) => (
                  <div
                    key={link.id}
                    className='text-muted-foreground border-b pb-2 text-sm last:border-none'
                  >
                    <div className='font-medium'>
                      Target URL: {link.source.url || '(empty)'}
                    </div>
                    <div>Status: {link.status ?? 'Unknown'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

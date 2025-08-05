import { getUrlById } from '@/lib/api/urls';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Info, Replace } from 'lucide-react';
import { IconAlertTriangle, IconLink } from '@tabler/icons-react';
import Link from 'next/link';

interface UrlViewPageProps {
  clientId: string;
  urlId: string;
}

const issueMap: Record<string, React.ReactNode> = {
  pages_missing_title: (
    <span className='flex items-center gap-1'>
      <IconAlertTriangle className='text-destructive h-4 w-4' />
      Missing Meta Title
    </span>
  ),
  too_short_title: 'Meta Title Too Short',
  too_long_title: 'Meta Title Too Long',
  pages_missing_description: (
    <span className='flex items-center gap-1'>
      <IconAlertTriangle className='text-destructive h-4 w-4' />
      Missing Meta Description
    </span>
  ),
  too_short_description: 'Meta Description Too Short',
  too_long_description: 'Meta Description Too Long',
  pages_missing_h1: 'Missing H1 Tag',
  pages_multiple_h1: 'Multiple H1 Tags',
  pages_missing_h2: 'Missing H2 Tag',
  pages_missing_h3: 'Missing H3 Tag',
  pages_with_multiple_h2s: 'Multiple H2 Tags',
  pages_missing_h4: 'Missing H4 Tag',
  pages_missing_h5: 'Missing H5 Tag',
  pages_missing_h6: 'Missing H6 Tag',
  pages_4xx_response: '4xx Response',
  pages_5xx_response: '5xx Response'
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
            <Link href={url.url}>
              <IconLink className='text-muted-foreground h-4 w-4' />
            </Link>
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
              <ul className='list-inside'>
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
          {url.internalLinks && url.internalLinks.length > 0 && (
            <div>
              <div className='mt-6 mb-2 flex items-center gap-2'>
                <h3 className='text-lg font-semibold'>Unique Outlinks</h3>
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
                {url.internalLinks.map((link) => (
                  <div
                    key={link}
                    className='text-muted-foreground border-b pb-2 text-sm last:border-none'
                  >
                    {link}
                    <Link href={link}>
                      <IconLink className='text-muted-foreground h-4 w-4' />
                    </Link>
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

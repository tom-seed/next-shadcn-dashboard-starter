import { getUrlById } from '@/lib/api/urls';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface UrlViewPageProps {
  clientId: string;
  urlId: string;
}

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
            {url.issues?.length > 0 ? (
              <ul className='text-destructive list-inside list-disc'>
                {url.issues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            ) : (
              <p className='text-muted-foreground'>None</p>
            )}
          </div>
        </div>

        {url.linkedFrom && url.linkedFrom.length > 0 && (
          <div>
            <h3 className='mt-6 mb-2 text-lg font-semibold'>Linked From</h3>
            <div className='bg-muted/30 max-h-48 space-y-2 overflow-y-auto rounded-md border p-3'>
              {url.linkedFrom.map((link) => (
                <div
                  key={link.id}
                  className='text-muted-foreground border-b pb-2 text-sm last:border-none'
                >
                  <div className='font-medium'>
                    Page: {link.source?.url ?? '(unknown)'}
                  </div>
                  <div>Status: {link.source?.status ?? 'Unknown'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {url.outgoingLinks && url.outgoingLinks.length > 0 && (
          <div>
            <h3 className='mt-6 mb-2 text-lg font-semibold'>Links To</h3>
            <div className='bg-muted/30 max-h-48 space-y-2 overflow-y-auto rounded-md border p-3'>
              {url.outgoingLinks.map((link) => (
                <div
                  key={link.id}
                  className='text-muted-foreground border-b pb-2 text-sm last:border-none'
                >
                  <div className='font-medium'>
                    Target URL: {link.targetUrl || '(empty)'}
                  </div>
                  <div>Status: {link.status ?? 'Unknown'}</div>
                  {link.target?.url && (
                    <div className='text-xs'>
                      → Crawled Target: {link.target.url}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

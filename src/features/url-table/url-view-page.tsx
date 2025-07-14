// FILE: src/features/url-table/url-view-page.tsx
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
            <span className='data-[error=true]:text-destructive flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50'>
              URL:
            </span>
            <p className='text-muted-foreground text-sm break-all'>{url.url}</p>
          </div>
          <div>
            <span className='data-[error=true]:text-destructive flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50'>
              Status:
            </span>
            <p className='text-muted-foreground'>{url.status ?? 'N/A'}</p>
          </div>
          <div>
            <span className='data-[error=true]:text-destructive flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50'>
              Meta Title:
            </span>
            <p className='text-muted-foreground'>{url.metaTitle || 'N/A'}</p>
          </div>
          <div>
            <span className='data-[error=true]:text-destructive flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50'>
              Meta Description:
            </span>
            <p className='text-muted-foreground'>
              {url.metaDescription || 'N/A'}
            </p>
          </div>
          <div>
            <span className='data-[error=true]:text-destructive flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50'>
              H1:
            </span>
            <p className='text-muted-foreground'>{url.h1 || 'N/A'}</p>
          </div>
          {url.issues.map((issue, index) => (
            <div key={index}>
              <span className='data-[error=true]:text-destructive flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50'>
                Issue {index + 1}:
              </span>
              <p className='text-destructive'>{issue}</p>
            </div>
          ))}
          {/* Add more fields below as needed */}
        </div>
      </CardContent>
    </Card>
  );
}

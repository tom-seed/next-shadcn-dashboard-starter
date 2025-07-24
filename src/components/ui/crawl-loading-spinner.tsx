import { Loader2 } from 'lucide-react';

export function CrawlLoadingSpinner() {
  return (
    <div className='flex h-[calc(100vh-10rem)] w-full flex-col items-center justify-center space-y-4 text-center'>
      <Loader2 className='text-muted-foreground h-10 w-10 animate-spin' />
      <p className='text-muted-foreground text-sm'>
        Grabbing crawl results… hang tight!
      </p>
    </div>
  );
}

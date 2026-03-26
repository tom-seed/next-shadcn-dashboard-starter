'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Globe,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type CrawledUrl = {
  url: string;
  status: number;
  title: string | null;
  depth: number;
};

type Props = {
  clientId: number;
  domain?: string | null;
};

const MAX_VISIBLE = 50;

function StatusBadge({ status }: { status: number }) {
  if (status >= 200 && status < 300) {
    return (
      <Badge className='shrink-0 border-transparent bg-emerald-100 font-mono text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'>
        {status}
      </Badge>
    );
  }
  if (status >= 300 && status < 400) {
    return (
      <Badge className='shrink-0 border-transparent bg-amber-100 font-mono text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'>
        {status}
      </Badge>
    );
  }
  return (
    <Badge className='shrink-0 border-transparent bg-red-100 font-mono text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300'>
      {status}
    </Badge>
  );
}

export function CrawlLiveFeed({ clientId, domain }: Props) {
  const router = useRouter();
  const [urls, setUrls] = useState<CrawledUrl[]>([]);
  const [pagesProcessed, setPagesProcessed] = useState(0);
  const [queueSize, setQueueSize] = useState(0);
  const [done, setDone] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  useEffect(() => {
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.NEXT_PUBLIC_NODE_API ||
      '';
    if (!backendUrl) return;

    const url = new URL('/sse/events', backendUrl);
    url.searchParams.set('clientId', String(clientId));
    const es = new EventSource(url.toString(), { withCredentials: true });

    es.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data);

        if (payload.type === 'crawl_progress') {
          setPagesProcessed(payload.pagesProcessed);
          setQueueSize(payload.queueSize);
          setUrls((prev) => {
            const next = [
              {
                url: payload.url,
                status: payload.status,
                title: payload.title,
                depth: payload.depth
              },
              ...prev
            ];
            return next.slice(0, MAX_VISIBLE);
          });
        }

        if (
          payload.type === 'audit_complete' ||
          payload.type === 'audit_snapshot'
        ) {
          setDone(true);
          es.close();
          router.refresh();
        }
      } catch {}
    };

    return () => es.close();
  }, [clientId, router]);

  // Auto-scroll the list to top when new items arrive (list is newest-first)
  useEffect(() => {
    if (shouldAutoScroll.current && listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [urls]);

  return (
    <div className='mx-auto flex w-full max-w-3xl flex-col gap-6 py-8'>
      {/* Header */}
      <div className='flex flex-col gap-1'>
        <div className='flex items-center gap-2.5'>
          {done ? (
            <CheckCircle2 className='h-5 w-5 text-emerald-500' />
          ) : (
            <Loader2 className='text-muted-foreground h-5 w-5 animate-spin' />
          )}
          <h2 className='text-base font-semibold'>
            {done ? 'Crawl complete — loading results…' : 'Crawl in progress'}
          </h2>
        </div>
        {domain && (
          <p className='text-muted-foreground ml-7 text-sm'>{domain}</p>
        )}
      </div>

      {/* Stats bar */}
      <div className='bg-muted/50 flex items-center gap-6 rounded-lg px-4 py-3 text-sm'>
        <div className='flex items-center gap-1.5'>
          <Globe className='text-muted-foreground h-4 w-4' />
          <span className='font-mono font-semibold tabular-nums'>
            {pagesProcessed.toLocaleString()}
          </span>
          <span className='text-muted-foreground'>pages crawled</span>
        </div>
        <div className='text-muted-foreground'>·</div>
        <div className='flex items-center gap-1.5'>
          <ArrowRight className='text-muted-foreground h-4 w-4' />
          <span className='font-mono font-semibold tabular-nums'>
            {queueSize.toLocaleString()}
          </span>
          <span className='text-muted-foreground'>in queue</span>
        </div>
      </div>

      {/* URL feed */}
      {urls.length === 0 ? (
        <div className='text-muted-foreground flex items-center gap-2 text-sm'>
          <Loader2 className='h-3.5 w-3.5 animate-spin' />
          Waiting for first page…
        </div>
      ) : (
        <div
          ref={listRef}
          onMouseEnter={() => {
            shouldAutoScroll.current = false;
          }}
          onMouseLeave={() => {
            shouldAutoScroll.current = true;
          }}
          className='border-border flex max-h-[50vh] flex-col gap-px overflow-y-auto rounded-lg border'
        >
          {urls.map((entry, i) => (
            <div
              key={`${entry.url}-${i}`}
              className='bg-background hover:bg-muted/40 flex items-center gap-3 px-3 py-2 transition-colors'
            >
              <StatusBadge status={entry.status} />
              <div className='min-w-0 flex-1'>
                <p className='truncate font-mono text-xs'>{entry.url}</p>
                {entry.title && (
                  <p className='text-muted-foreground truncate text-xs'>
                    {entry.title}
                  </p>
                )}
              </div>
              <span className='text-muted-foreground shrink-0 font-mono text-xs'>
                d{entry.depth}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLinkIcon, ArrowRightIcon } from 'lucide-react';
import Link from 'next/link';
import { SuggestionRow } from './columns';

interface SuggestionCardsProps {
  data: SuggestionRow[];
}

export default function SuggestionCards({ data }: SuggestionCardsProps) {
  if (data.length === 0) {
    return (
      <div className='text-muted-foreground py-10 text-center'>
        No suggestions found.
      </div>
    );
  }

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
      {data.map((item) => (
        <Card
          key={item.id}
          className='border-l-primary/50 flex h-full flex-col border-l-4 transition-all hover:shadow-md'
        >
          <CardHeader className='pb-2'>
            <div className='flex items-start justify-between gap-2'>
              <Badge
                variant='outline'
                className='text-[10px] font-semibold tracking-wider uppercase'
              >
                Score: {item.score.toFixed(2)}
              </Badge>
            </div>
            <CardTitle
              className='text-muted-foreground line-clamp-2 text-sm leading-normal font-medium break-words'
              title={item.sourceUrl}
            >
              {item.sourceUrl}
            </CardTitle>
          </CardHeader>
          <CardContent className='flex-1 pb-2'>
            <div className='bg-muted/30 flex flex-col gap-2 rounded-md border border-dashed p-3'>
              <div className='text-primary flex items-center gap-2 text-xs font-semibold'>
                <ArrowRightIcon className='h-3 w-3' />
                Suggested Target
              </div>
              <p
                className='line-clamp-3 text-sm leading-tight font-semibold break-words'
                title={item.targetUrl}
              >
                {item.targetUrl}
              </p>
            </div>
            {item.anchorText && (
              <div className='text-muted-foreground mt-3 text-xs'>
                <span className='font-semibold'>Anchor:</span> &quot;
                {item.anchorText}&quot;
              </div>
            )}
          </CardContent>
          <CardFooter className='pt-2'>
            <Button
              variant='ghost'
              size='sm'
              className='h-8 w-full text-xs'
              asChild
            >
              <Link href={item.sourceUrl} target='_blank'>
                Visit Page <ExternalLinkIcon className='ml-2 h-3 w-3' />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

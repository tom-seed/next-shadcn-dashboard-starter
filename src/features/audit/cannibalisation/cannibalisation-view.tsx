'use client';

import { useEffect, useState, useTransition } from 'react';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import PageContainer from '@/components/layout/page-container';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button'; // Added import
import Link from 'next/link';
import { ExternalLinkIcon } from 'lucide-react';

interface CannibalisationViewProps {
  clientId: string;
}

interface Issue {
  id: number;
  url: string;
  metadata: any;
}

interface GroupedIssue {
  groupId: string;
  urls: string[];
}

export default function CannibalisationView({
  clientId
}: CannibalisationViewProps) {
  const [groups, setGroups] = useState<GroupedIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        // Fetch all issues (or a reasonable limit)
        const res = await fetch(
          `/api/clients/${clientId}/audits/issues/cannibalisation_group?perPage=1000`
        );
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();

        const issues: Issue[] = data.issues || [];

        // Group by metadata.group or fallback to 'Unknown'
        const grouped: Record<string, string[]> = {};

        issues.forEach((issue) => {
          // Assuming metadata has a 'group' or 'keyword' or similar property that identifies the cluster
          // If metadata is null or empty, we can't group effectively.
          // Let's assume 'group' or 'topic' property exists.
          const groupId =
            issue.metadata?.group ||
            issue.metadata?.topic ||
            issue.metadata?.keyword ||
            'Ungrouped';

          if (!grouped[groupId]) {
            grouped[groupId] = [];
          }
          grouped[groupId].push(issue.url);
        });

        const groupArray: GroupedIssue[] = Object.entries(grouped)
          .map(([groupId, urls]) => ({
            groupId,
            urls
          }))
          .sort((a, b) => b.urls.length - a.urls.length); // Sort by size

        setGroups(groupArray);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    startTransition(() => {
      fetchIssues();
    });
  }, [clientId]);

  return (
    <PageContainer scrollable>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Cannibalisation Groups'
            description='Groups of pages competing for the same keywords or intent.'
          />
        </div>
        <Separator />

        {isLoading ? (
          <div>Loading groups...</div>
        ) : groups.length === 0 ? (
          <div>No cannibalisation groups found.</div>
        ) : (
          <div className='grid gap-4'>
            <Accordion type='single' collapsible className='w-full space-y-4'>
              {groups.map((group, idx) => (
                <AccordionItem
                  key={idx}
                  value={`item-${idx}`}
                  className='border-0'
                >
                  <Card className='border-l-4 border-l-orange-500'>
                    <CardHeader className='p-0'>
                      <AccordionTrigger className='hover:bg-muted/50 px-6 py-4 transition-colors hover:no-underline'>
                        <div className='flex w-full items-center justify-between pr-4'>
                          <div className='flex flex-col items-start gap-1'>
                            <div className='flex items-center gap-2'>
                              <span className='text-lg font-bold'>
                                {group.groupId !== 'Ungrouped'
                                  ? group.groupId
                                  : 'Uncategorized Conflicts'}
                              </span>
                              <Badge
                                variant='outline'
                                className='border-orange-500 bg-orange-50 text-orange-600'
                              >
                                Conflict Group
                              </Badge>
                            </div>
                            <span className='text-muted-foreground text-sm'>
                              {group.urls.length} pages are competing for this
                              topic.
                            </span>
                          </div>
                        </div>
                      </AccordionTrigger>
                    </CardHeader>
                    <AccordionContent className='border-t px-6 pt-0 pb-6'>
                      <div className='space-y-3 pt-4'>
                        <div className='text-muted-foreground mb-2 text-sm'>
                          Affected Pages:
                        </div>
                        {group.urls.map((url, i) => (
                          <div
                            key={i}
                            className='bg-muted/40 group-hover:border-primary/50 flex items-center justify-between rounded-md border p-3 transition-colors'
                          >
                            <span className='flex-1 truncate text-sm font-medium'>
                              {url}
                            </span>
                            <Link
                              href={url}
                              target='_blank'
                              rel='noopener noreferrer'
                            >
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-8 w-8'
                              >
                                <ExternalLinkIcon className='h-4 w-4' />
                              </Button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

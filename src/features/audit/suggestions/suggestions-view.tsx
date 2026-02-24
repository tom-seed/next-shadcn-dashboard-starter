'use client';

import { useEffect, useState, useTransition } from 'react';
import { useQueryStates, parseAsInteger } from 'nuqs';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { SuggestionRow, columns } from './columns';
import { Heading } from '@/components/ui/heading';
import PageContainer from '@/components/layout/page-container';
import { useDataTable } from '@/hooks/use-data-table';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  IconLink,
  IconArrowRight,
  IconExternalLink,
  IconSparkles,
  IconTarget,
  IconTrendingUp
} from '@tabler/icons-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

const searchParamDefs = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10)
};

interface SuggestionsViewProps {
  clientId: string;
}

export default function SuggestionsView({ clientId }: SuggestionsViewProps) {
  const [data, setData] = useState<SuggestionRow[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [searchParams] = useQueryStates(searchParamDefs);

  const fetchData = useDebouncedCallback(async () => {
    const { page, perPage } = searchParams;
    const query = new URLSearchParams({
      page: String(page),
      perPage: String(perPage)
    });

    try {
      const res = await fetch(
        `/api/clients/${clientId}/audits/suggestions?${query.toString()}`
      );
      if (!res.ok) throw new Error('Failed to fetch');
      const result = await res.json();
      setData(result.suggestions || []);
      setTotalItems(result.totalCount || 0);
    } catch {
      setData([]);
    }
  }, 300);

  useEffect(() => {
    startTransition(() => {
      fetchData();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, clientId]);

  const { table } = useDataTable({
    data,
    columns,
    pageCount: Math.ceil(totalItems / (searchParams.perPage || 1)) || 1,
    initialState: {
      pagination: {
        pageIndex: searchParams.page - 1,
        pageSize: searchParams.perPage
      }
    },
    enableSorting: true,
    enableColumnFilters: true
  });

  // Compute summary metrics
  const avgScore =
    data.length > 0
      ? data.reduce((sum, s) => sum + s.score, 0) / data.length
      : 0;
  const highConfidence = data.filter((s) => s.score >= 0.8).length;
  const withAnchor = data.filter((s) => s.anchorText).length;

  function getScoreColor(score: number) {
    if (score >= 0.8)
      return 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/20';
    if (score >= 0.6)
      return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20';
    if (score >= 0.4)
      return 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/20';
    return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/20';
  }

  function SummaryCard({
    icon: Icon,
    label,
    value,
    subtitle,
    color
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string | number;
    subtitle?: string;
    color: string;
  }) {
    return (
      <Card>
        <CardContent className='flex items-center gap-4 py-4'>
          <div className={`rounded-lg p-2.5 ${color}`}>
            <Icon className='h-5 w-5' />
          </div>
          <div className='flex flex-col'>
            <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
              {label}
            </p>
            <p className='text-2xl font-bold tabular-nums'>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {subtitle && (
              <p className='text-muted-foreground text-xs'>{subtitle}</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  function LoadingSkeleton() {
    return (
      <div className='flex flex-1 flex-col gap-6'>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className='flex items-center gap-4 py-4'>
                <Skeleton className='h-10 w-10 rounded-lg' />
                <div className='flex flex-col gap-2'>
                  <Skeleton className='h-3 w-20' />
                  <Skeleton className='h-7 w-16' />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className='h-48 rounded-lg' />
          ))}
        </div>
      </div>
    );
  }

  function EmptyState() {
    return (
      <Card className='flex min-h-[400px] flex-col items-center justify-center'>
        <CardContent className='flex flex-col items-center gap-4 py-10'>
          <div className='bg-muted rounded-full p-4'>
            <IconLink className='text-muted-foreground h-8 w-8' />
          </div>
          <div className='text-center'>
            <h3 className='text-lg font-semibold'>No suggestions found</h3>
            <p className='text-muted-foreground mt-1 text-sm'>
              Internal link suggestions will appear here once your content has
              been analyzed.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  function SuggestionCard({ item }: { item: SuggestionRow }) {
    const scoreColor = getScoreColor(item.score);

    return (
      <Card className='group flex h-full flex-col transition-all hover:shadow-md'>
        <CardHeader className='pb-2'>
          <div className='flex items-start justify-between gap-2'>
            <Badge
              variant='outline'
              className={`text-xs font-semibold ${scoreColor}`}
            >
              {(item.score * 100).toFixed(0)}% match
            </Badge>
            <Link href={item.sourceUrl} target='_blank'>
              <Button variant='ghost' size='icon' className='h-7 w-7'>
                <IconExternalLink className='h-3.5 w-3.5' />
              </Button>
            </Link>
          </div>
          <CardTitle
            className='text-muted-foreground line-clamp-2 text-sm leading-normal font-medium break-words'
            title={item.sourceUrl}
          >
            {item.sourceUrl.replace(/^https?:\/\/[^/]+/, '')}
          </CardTitle>
        </CardHeader>
        <CardContent className='flex flex-1 flex-col gap-3 pb-4'>
          <div className='bg-muted/30 flex flex-col gap-2 rounded-md border border-dashed p-3'>
            <div className='text-primary flex items-center gap-2 text-xs font-semibold'>
              <IconArrowRight className='h-3 w-3' />
              Link to
            </div>
            <p
              className='line-clamp-2 text-sm leading-tight font-medium break-words'
              title={item.targetUrl}
            >
              {item.targetUrl.replace(/^https?:\/\/[^/]+/, '')}
            </p>
          </div>
          {item.anchorText && (
            <div className='flex items-center gap-2'>
              <span className='text-muted-foreground text-xs'>Anchor:</span>
              <Badge variant='secondary' className='text-xs font-normal'>
                &ldquo;{item.anchorText}&rdquo;
              </Badge>
            </div>
          )}
          <Progress
            value={item.score * 100}
            className='mt-auto h-1 [&_[data-slot=progress-indicator]]:bg-blue-500'
          />
        </CardContent>
      </Card>
    );
  }

  if (isPending && data.length === 0) {
    return (
      <PageContainer>
        <div className='flex flex-1 flex-col gap-6'>
          <Heading
            title='Internal Link Suggestions'
            description='AI-powered recommendations for internal linking opportunities'
          />
          <LoadingSkeleton />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col gap-6'>
        <Heading
          title='Internal Link Suggestions'
          description='AI-powered recommendations for internal linking opportunities'
        />

        {totalItems === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Summary Cards */}
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
              <SummaryCard
                icon={IconLink}
                label='Total Suggestions'
                value={totalItems}
                subtitle='Link opportunities found'
                color='bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
              />
              <SummaryCard
                icon={IconTrendingUp}
                label='Avg Confidence'
                value={`${(avgScore * 100).toFixed(0)}%`}
                subtitle='Average match score'
                color='bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
              />
              <SummaryCard
                icon={IconSparkles}
                label='High Confidence'
                value={highConfidence}
                subtitle='Suggestions ≥80% match'
                color='bg-violet-100 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400'
              />
              <SummaryCard
                icon={IconTarget}
                label='With Anchor Text'
                value={withAnchor}
                subtitle='Suggested anchor text'
                color='bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
              />
            </div>

            {/* Tabs for Cards/Table */}
            <Tabs defaultValue='cards' className='space-y-4'>
              <TabsList>
                <TabsTrigger value='cards'>Card View</TabsTrigger>
                <TabsTrigger value='table'>Table View</TabsTrigger>
              </TabsList>

              <TabsContent value='cards'>
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                  {data.map((item) => (
                    <SuggestionCard key={item.id} item={item} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value='table'>
                <Card>
                  <CardHeader className='pb-3'>
                    <CardTitle className='text-base'>All Suggestions</CardTitle>
                    <CardDescription className='text-xs'>
                      Browse and filter link suggestions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DataTable table={table}>
                      <DataTableToolbar table={table} />
                    </DataTable>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Top Suggestions Preview */}
            <Card>
              <CardHeader className='pb-3'>
                <CardTitle className='text-base'>
                  Top Suggestions by Confidence
                </CardTitle>
                <CardDescription className='text-xs'>
                  Highest confidence internal linking opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  {data.slice(0, 5).map((suggestion) => {
                    const scoreColor = getScoreColor(suggestion.score);

                    return (
                      <div
                        key={suggestion.id}
                        className='hover:bg-muted/50 flex items-center gap-4 rounded-md px-3 py-2.5 transition-colors'
                      >
                        <Badge
                          variant='outline'
                          className={`shrink-0 text-[10px] font-semibold ${scoreColor}`}
                        >
                          {(suggestion.score * 100).toFixed(0)}%
                        </Badge>
                        <div className='flex min-w-0 flex-1 items-center gap-2'>
                          <span
                            className='truncate text-sm font-medium'
                            title={suggestion.sourceUrl}
                          >
                            {suggestion.sourceUrl.replace(
                              /^https?:\/\/[^/]+/,
                              ''
                            )}
                          </span>
                          <IconArrowRight className='text-muted-foreground h-3.5 w-3.5 shrink-0' />
                          <span
                            className='text-muted-foreground truncate text-sm'
                            title={suggestion.targetUrl}
                          >
                            {suggestion.targetUrl.replace(
                              /^https?:\/\/[^/]+/,
                              ''
                            )}
                          </span>
                        </div>
                        <Link
                          href={suggestion.sourceUrl}
                          target='_blank'
                          className='shrink-0'
                        >
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-7 w-7'
                          >
                            <IconExternalLink className='h-3.5 w-3.5' />
                          </Button>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PageContainer>
  );
}

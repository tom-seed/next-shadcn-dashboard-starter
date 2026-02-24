'use client';

import { useEffect, useState, useTransition } from 'react';
import { useQueryStates, parseAsInteger } from 'nuqs';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { ClusterRow, columns } from './columns';
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
import {
  IconStack2,
  IconChartBubble,
  IconFileText,
  IconTrendingUp
} from '@tabler/icons-react';
import ClusterChart from './cluster-chart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const searchParamDefs = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10)
};

interface ClustersViewProps {
  clientId: string;
}

export default function ClustersView({ clientId }: ClustersViewProps) {
  const [data, setData] = useState<ClusterRow[]>([]);
  const [allData, setAllData] = useState<ClusterRow[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [searchParams] = useQueryStates(searchParamDefs);

  const fetchData = useDebouncedCallback(async () => {
    const { page, perPage } = searchParams;

    // Fetch paginated data for table
    const query = new URLSearchParams({
      page: String(page),
      perPage: String(perPage)
    });

    // Also fetch all for chart (up to 100)
    const allQuery = new URLSearchParams({
      page: '1',
      perPage: '100'
    });

    try {
      const [res, allRes] = await Promise.all([
        fetch(`/api/clients/${clientId}/audits/clusters?${query.toString()}`),
        fetch(`/api/clients/${clientId}/audits/clusters?${allQuery.toString()}`)
      ]);

      if (!res.ok) throw new Error('Failed to fetch');
      const result = await res.json();
      setData(result.clusters || []);
      setTotalItems(result.totalCount || 0);

      if (allRes.ok) {
        const allResult = await allRes.json();
        setAllData(allResult.clusters || []);
      }
    } catch {
      setData([]);
      setAllData([]);
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
  const totalClusters = totalItems;
  const totalPages = allData.reduce((sum, c) => sum + c.memberCount, 0);
  const avgDensity =
    allData.length > 0
      ? allData.reduce((sum, c) => sum + (c.density || 0), 0) / allData.length
      : 0;
  const largestCluster =
    allData.length > 0 ? Math.max(...allData.map((c) => c.memberCount)) : 0;
  const highDensityClusters = allData.filter(
    (c) => (c.density || 0) >= 0.7
  ).length;

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
        <Skeleton className='h-[400px] w-full rounded-lg' />
      </div>
    );
  }

  function EmptyState() {
    return (
      <Card className='flex min-h-[400px] flex-col items-center justify-center'>
        <CardContent className='flex flex-col items-center gap-4 py-10'>
          <div className='bg-muted rounded-full p-4'>
            <IconStack2 className='text-muted-foreground h-8 w-8' />
          </div>
          <div className='text-center'>
            <h3 className='text-lg font-semibold'>No clusters found</h3>
            <p className='text-muted-foreground mt-1 text-sm'>
              Topic clusters will appear here once your content has been
              analyzed.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isPending && data.length === 0) {
    return (
      <PageContainer>
        <div className='flex flex-1 flex-col gap-6'>
          <Heading
            title='Topic Clusters'
            description='Semantic topic clusters identified from your content'
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
          title='Topic Clusters'
          description='Semantic topic clusters identified from your content'
        />

        {totalItems === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Summary Cards */}
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
              <SummaryCard
                icon={IconStack2}
                label='Total Clusters'
                value={totalClusters}
                subtitle='Topic groups identified'
                color='bg-violet-100 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400'
              />
              <SummaryCard
                icon={IconFileText}
                label='Pages Clustered'
                value={totalPages}
                subtitle='Pages assigned to topics'
                color='bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
              />
              <SummaryCard
                icon={IconChartBubble}
                label='Avg Density'
                value={avgDensity.toFixed(2)}
                subtitle='Topic cohesion score'
                color='bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
              />
              <SummaryCard
                icon={IconTrendingUp}
                label='High Density'
                value={highDensityClusters}
                subtitle='Clusters with density ≥0.7'
                color='bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
              />
            </div>

            {/* Tabs for Chart/Table */}
            <Tabs defaultValue='chart' className='space-y-4'>
              <TabsList>
                <TabsTrigger value='chart'>Chart View</TabsTrigger>
                <TabsTrigger value='table'>Table View</TabsTrigger>
              </TabsList>

              <TabsContent value='chart'>
                <ClusterChart data={allData} />
              </TabsContent>

              <TabsContent value='table'>
                <Card>
                  <CardHeader className='pb-3'>
                    <CardTitle className='text-base'>All Clusters</CardTitle>
                    <CardDescription className='text-xs'>
                      Browse and filter topic clusters
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

            {/* Top Clusters Preview */}
            <Card>
              <CardHeader className='pb-3'>
                <CardTitle className='text-base'>
                  Top Clusters by Size
                </CardTitle>
                <CardDescription className='text-xs'>
                  Largest topic clusters by page count
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {allData.slice(0, 5).map((cluster) => {
                    const pct =
                      totalPages > 0
                        ? Math.round((cluster.memberCount / totalPages) * 100)
                        : 0;
                    const densityColor =
                      (cluster.density || 0) >= 0.7
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : (cluster.density || 0) >= 0.4
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-600 dark:text-slate-400';

                    return (
                      <div
                        key={cluster.id}
                        className='hover:bg-muted/50 flex items-center justify-between rounded-md px-3 py-2.5 transition-colors'
                      >
                        <div className='flex items-center gap-3'>
                          <Badge
                            variant='outline'
                            className='border-transparent bg-violet-100 text-[10px] text-violet-700 dark:bg-violet-900/20 dark:text-violet-300'
                          >
                            Cluster
                          </Badge>
                          <span className='font-medium'>
                            {cluster.label || `Cluster ${cluster.id}`}
                          </span>
                        </div>
                        <div className='flex items-center gap-4'>
                          <div className='flex items-center gap-2'>
                            <span className='text-muted-foreground text-xs'>
                              Density:
                            </span>
                            <span
                              className={`font-bold tabular-nums ${densityColor}`}
                            >
                              {(cluster.density || 0).toFixed(2)}
                            </span>
                          </div>
                          <div className='flex items-center gap-2'>
                            <span className='font-bold tabular-nums'>
                              {cluster.memberCount}
                            </span>
                            <span className='text-muted-foreground text-xs'>
                              pages ({pct}%)
                            </span>
                          </div>
                          <Progress
                            value={pct}
                            className='h-1.5 w-20 [&_[data-slot=progress-indicator]]:bg-violet-500'
                          />
                        </div>
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

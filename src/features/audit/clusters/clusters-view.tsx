'use client';

import { useEffect, useState, useTransition } from 'react';
import { useQueryStates, parseAsInteger } from 'nuqs';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { ClusterRow, columns } from './columns';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import PageContainer from '@/components/layout/page-container';
import { useDataTable } from '@/hooks/use-data-table';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';

const searchParamDefs = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10)
};

interface ClustersViewProps {
  clientId: string;
}

import ClusterChart from './cluster-chart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ClustersView({ clientId }: ClustersViewProps) {
  const [data, setData] = useState<ClusterRow[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isPending, startTransition] = useTransition();
  const [searchParams] = useQueryStates(searchParamDefs);

  const fetchData = useDebouncedCallback(async () => {
    // Fetch generic data (maybe fetch all for chart, paginated for table?)
    // For now, let's fetch a larger page size if on chart view, or just rely on current pagination.
    // Chart works best with MORE data.
    // Let's assume pagination applies to both for simplicity, or fetch separate for chart.
    // Ideally, for the chart we want "all clusters".
    // Let's modify the fetch to handle this or just show current page on chart.
    // Showing current page on chart is okay for v1.
    const { page, perPage } = searchParams;
    const query = new URLSearchParams({
      page: String(page),
      perPage: String(perPage)
    });

    try {
      const res = await fetch(
        `/api/clients/${clientId}/audits/clusters?${query.toString()}`
      );
      if (!res.ok) throw new Error('Failed to fetch');
      const result = await res.json();
      setData(result.clusters || []);
      setTotalItems(result.totalCount || 0);
    } catch (error) {
      console.error(error);
      setData([]);
    }
  }, 300);

  useEffect(() => {
    startTransition(() => {
      fetchData();
    });
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

  return (
    <PageContainer scrollable>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Topic Clusters'
            description='Semantic clusters identified in the crawl.'
          />
        </div>
        <Separator />

        <Tabs defaultValue='chart' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='chart'>Chart View</TabsTrigger>
            <TabsTrigger value='table'>Table View</TabsTrigger>
          </TabsList>
          <TabsContent value='chart' className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
              <ClusterChart data={data} />
            </div>
          </TabsContent>
          <TabsContent value='table' className='space-y-4'>
            <DataTable table={table}>
              <DataTableToolbar table={table} />
            </DataTable>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}

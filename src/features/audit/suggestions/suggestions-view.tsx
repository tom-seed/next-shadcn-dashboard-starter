'use client';

import { useEffect, useState, useTransition } from 'react';
import { useQueryStates, parseAsInteger } from 'nuqs';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { SuggestionRow, columns } from './columns';
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

interface SuggestionsViewProps {
  clientId: string;
}

import SuggestionCards from './suggestion-cards';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SuggestionsView({ clientId }: SuggestionsViewProps) {
  const [data, setData] = useState<SuggestionRow[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
            title='Internal Link Suggestions'
            description='Recommended internal links based on semantic similarity.'
          />
        </div>
        <Separator />

        <Tabs defaultValue='cards' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='cards'>Card View</TabsTrigger>
            <TabsTrigger value='table'>Table View</TabsTrigger>
          </TabsList>
          <TabsContent value='cards' className='space-y-4'>
            <SuggestionCards data={data} />
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

'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  useQueryStates,
  parseAsInteger,
  parseAsString,
  createParser
} from 'nuqs';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { AuditIssueTable } from './table';
import { getAuditIssueColumns } from './columns';
import {
  Updater,
  SortingState,
  ColumnFiltersState
} from '@tanstack/react-table';
import TitleIssueDescription from '../issue-descriptions/titles';

const parseSortParam = createParser<string[]>({
  parse: (value): string[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',');
    return [];
  },
  serialize: (value: string[]): string => value.join(',')
});

const searchParamDefs = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  url: parseAsString.withDefault(''),
  sort: parseSortParam.withDefault([])
};

export interface AuditIssueRow {
  id: number;
  url: string;
}

interface AuditIssueViewClientProps {
  clientId: number;
  issueKey: string;
}

export default function AuditIssueViewClient({
  clientId,
  issueKey
}: AuditIssueViewClientProps) {
  const columns = getAuditIssueColumns();
  const [data, setData] = useState<AuditIssueRow[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isPending, startTransition] = useTransition();

  const [searchParams, setSearchParams] = useQueryStates(searchParamDefs);

  const fetchData = useDebouncedCallback(async () => {
    const { page, perPage, url } = searchParams;

    const query = new URLSearchParams({
      page: String(page),
      perPage: String(perPage),
      url
    });

    const res = await fetch(
      `/api/client/${clientId}/audits/issues/${issueKey}?${query.toString()}`
    );
    const result = await res.json();

    const urls = Array.isArray(result.urls)
      ? result.urls.map((url: string, i: number) => ({ id: i, url }))
      : [];

    setData(urls);
    setTotalItems(result.totalCount || 0);
  }, 300);

  useEffect(() => {
    startTransition(() => {
      fetchData();
    });
  }, [searchParams, clientId, issueKey]);

  const resolveUpdater = <T,>(updater: Updater<T>, previous: T): T =>
    typeof updater === 'function'
      ? (updater as (old: T) => T)(previous)
      : updater;

  return (
    <div className='flex min-h-[calc(100vh-20rem)] flex-col space-y-4 p-4'>
      <h1 className='text-2xl font-bold'>
        {issueKey
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')}
      </h1>
      <TitleIssueDescription />
      <AuditIssueTable
        data={data}
        totalItems={totalItems}
        columns={columns}
        initialPage={searchParams.page}
        initialPerPage={searchParams.perPage}
        onSortingChange={(updater) => {
          const nextSort = resolveUpdater<SortingState>(updater, []);
          const sortParams = nextSort.map(
            (s) => `${s.id}:${s.desc ? 'desc' : 'asc'}`
          );
          setSearchParams((prev) => ({ ...prev, sort: sortParams, page: 1 }));
        }}
        onColumnFiltersChange={(updater) => {
          const nextFilters = resolveUpdater<ColumnFiltersState>(updater, []);
          const filterMap = Object.fromEntries(
            nextFilters.map((f) => [f.id, f.value])
          );
          setSearchParams((prev) => ({ ...prev, ...filterMap, page: 1 }));
        }}
      />
    </div>
  );
}

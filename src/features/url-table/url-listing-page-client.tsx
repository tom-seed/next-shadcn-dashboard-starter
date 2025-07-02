'use client';

import { useEffect, useState, useTransition } from 'react';
import { Urls } from '@prisma/client';
import { UrlTable } from './table';
import { getUrlColumns } from './columns';
import {
  useQueryStates,
  parseAsInteger,
  parseAsString,
  createParser
} from 'nuqs';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import {
  ColumnFiltersState,
  SortingState,
  Updater
} from '@tanstack/react-table';

// ✅ Custom parser using `createParser` to enable `withDefault`
const parseSortParam = createParser<string[]>({
  parse: (value): string[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return [];
  },
  serialize: (value: string[]): string => value.join(',') // Stored as comma-separated in URL
});

// ✅ Updated query param definitions
const searchParamDefs = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  url: parseAsString.withDefault(''),
  metaTitle: parseAsString.withDefault(''),
  status: parseAsString.withDefault(''),
  sort: parseSortParam.withDefault([])
};

interface UrlListingPageClientProps {
  clientId: number;
}

export default function UrlListingPageClient({
  clientId
}: UrlListingPageClientProps) {
  const columns = getUrlColumns(clientId);
  const [urls, setUrls] = useState<Urls[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, startTransition] = useTransition();

  const [searchParams, setSearchParams] = useQueryStates(searchParamDefs);

  const fetchData = useDebouncedCallback(async () => {
    const { page, perPage, url, metaTitle, status, sort } = searchParams;

    const query = new URLSearchParams({
      page: String(page),
      perPage: String(perPage),
      url,
      metaTitle,
      status
    });

    sort.forEach((s: string) => {
      if (typeof s === 'string' && s.includes(':')) {
        query.append('sort', s);
      }
    });

    const urlPath = `/api/client/${clientId}/urls?${query.toString()}`;
    console.log('🌐 Fetching:', urlPath);

    const res = await fetch(urlPath, { cache: 'no-store' });

    if (!res.ok) {
      console.error('❌ Failed to fetch URLs');
      return;
    }

    const data = await res.json();
    setUrls(data.urls || []);
    setTotalItems(data.totalCount || 0);
  }, 300);

  useEffect(() => {
    startTransition(() => {
      fetchData();
    });
  }, [searchParams]);

  const resolveUpdater = <T,>(updater: Updater<T>, previous: T): T => {
    return typeof updater === 'function'
      ? (updater as (old: T) => T)(previous)
      : updater;
  };

  return (
    <UrlTable
      data={urls}
      totalItems={totalItems}
      columns={columns}
      initialPage={searchParams.page}
      initialPerPage={searchParams.perPage}
      onSortingChange={(updater) => {
        const nextSort = resolveUpdater<SortingState>(updater, []);
        const sortParams = nextSort.map(
          (s): string => `${s.id}:${s.desc ? 'desc' : 'asc'}`
        );
        setSearchParams((prev) => ({
          ...prev,
          sort: sortParams,
          page: 1
        }));
      }}
      onColumnFiltersChange={(updater) => {
        const nextFilters = resolveUpdater<ColumnFiltersState>(updater, []);
        const filterMap = Object.fromEntries(
          nextFilters.map((f) => [f.id, f.value])
        );
        setSearchParams((prev) => ({
          ...prev,
          ...filterMap,
          page: 1
        }));
      }}
    />
  );
}

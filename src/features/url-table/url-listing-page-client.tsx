'use client';

import { useEffect, useState, useTransition } from 'react';
import { Urls } from '@prisma/client';
import { UrlTable } from './table';
import { getUrlColumns } from './columns';
import {
  useQueryStates,
  parseAsInteger,
  parseAsString,
  parseAsArrayOf
} from 'nuqs';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import {
  ColumnFiltersState,
  SortingState,
  Updater
} from '@tanstack/react-table';

const searchParamDefs = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  url: parseAsString.withDefault(''),
  metaTitle: parseAsString.withDefault(''),
  status: parseAsString.withDefault(''),
  sort: parseAsArrayOf(parseAsString).withDefault([])
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

    console.log('🔄 Fetching data with params:', {
      page,
      perPage,
      url,
      metaTitle,
      status,
      sort
    });

    const query = new URLSearchParams({
      page: String(page),
      perPage: String(perPage),
      url,
      metaTitle,
      status
    });

    sort.forEach((s) => {
      if (typeof s === 'string' && s.includes(':')) {
        query.append('sort', s);
      }
    });

    const res = await fetch(
      `/api/client/${clientId}/urls?${query.toString()}`,
      { cache: 'no-store' }
    );

    if (!res.ok) {
      console.error('❌ Failed to fetch URLs');
      return;
    }

    const data = await res.json();
    console.log('✅ Fetched data:', data);
    setUrls(data.urls || []);
    setTotalItems(data.totalCount || 0);
  }, 300);

  useEffect(() => {
    console.log('🚀 useEffect triggered — new searchParams:', searchParams);
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
          (s) => `${s.id}:${s.desc ? 'desc' : 'asc'}`
        );
        console.log('🧭 Sorting changed:', sortParams);
        setSearchParams((prev) => ({ ...prev, sort: sortParams }));
      }}
      onColumnFiltersChange={(updater) => {
        const nextFilters = resolveUpdater<ColumnFiltersState>(updater, []);
        const filterMap = Object.fromEntries(
          nextFilters.map((f) => [f.id, f.value])
        );
        console.log('🧹 Column filters changed:', filterMap);
        setSearchParams((prev) => ({
          ...prev,
          ...filterMap,
          page: 1
        }));
      }}
    />
  );
}

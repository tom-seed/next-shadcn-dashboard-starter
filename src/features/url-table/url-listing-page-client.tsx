'use client';

import { useEffect, useState, useTransition, useCallback } from 'react';
import { Urls } from '@prisma/client';
import { UrlTable } from './table';
import { getUrlColumns } from './columns';
import {
  useQueryStates,
  parseAsInteger,
  parseAsString,
  createParser
} from 'nuqs';
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

const searchParamDefs = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),

  // Filters for each column
  url: parseAsString.withDefault(''),
  metaTitle: parseAsString.withDefault(''),
  metaDescription: parseAsString.withDefault(''),
  canonical: parseAsString.withDefault(''),
  h1: parseAsString.withDefault(''),
  status: parseAsString.withDefault(''),

  // Multi-sort
  sort: parseSortParam.withDefault([])
};

interface UrlListingPageClientProps {
  clientId: number;
  crawlId?: number;
}

export default function UrlListingPageClient({
  clientId,
  crawlId
}: UrlListingPageClientProps) {
  const columns = getUrlColumns(clientId);
  const [urls, setUrls] = useState<Urls[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, startTransition] = useTransition();

  const [sortingState, setSortingState] = useState<SortingState>([]);
  const [filtersState, setFiltersState] = useState<ColumnFiltersState>([]);

  const [searchParams, setSearchParams] = useQueryStates(searchParamDefs);

  // Server-side pagination with filters and sorting.
  // Future plan: implement Redis caching to improve performance.
  const rawFetchData = useCallback(async () => {
    const {
      page,
      perPage,
      url,
      metaTitle,
      metaDescription,
      canonical,
      h1,
      status,
      sort
    } = searchParams;

    const query = new URLSearchParams({
      page: String(page),
      perPage: String(perPage)
    });

    if (url) query.append('url', url);
    if (metaTitle) query.append('metaTitle', metaTitle);
    if (metaDescription) query.append('metaDescription', metaDescription);
    if (canonical) query.append('canonical', canonical);
    if (h1) query.append('h1', h1);
    if (status) query.append('status', status);

    sort.forEach((s: string) => {
      if (typeof s === 'string' && s.includes(':')) {
        query.append('sort', s);
      }
    });

    const urlPath = `/api/clients/${clientId}/urls?${query.toString()}${crawlId ? `&crawlId=${crawlId}` : ''}`;

    const res = await fetch(urlPath, { cache: 'no-store' });
    if (!res.ok) return;

    const data = await res.json();
    setUrls(data.urls || []);
    setTotalItems(data.totalCount || 0);
  }, [clientId, crawlId, searchParams]);

  useEffect(() => {
    startTransition(() => {
      rawFetchData();
    });
  }, [rawFetchData, searchParams, startTransition]);

  return (
    <UrlTable
      data={urls}
      totalItems={totalItems}
      columns={columns}
      initialPage={searchParams.page}
      initialPerPage={searchParams.perPage}
      onSortingChange={(updater) => {
        const nextSort =
          typeof updater === 'function'
            ? (updater as (old: SortingState) => SortingState)(sortingState)
            : updater;
        setSortingState(nextSort);
        const sortParams = nextSort.map(
          (s): string => `${s.id}:${s.desc ? 'desc' : 'asc'}`
        );
        setSearchParams((prev) => ({ ...prev, sort: sortParams, page: 1 }));
        // fire immediately
        queueMicrotask(() => rawFetchData());
      }}
      onColumnFiltersChange={(updater) => {
        const nextFilters =
          typeof updater === 'function'
            ? (updater as (old: ColumnFiltersState) => ColumnFiltersState)(
                filtersState
              )
            : updater;
        setFiltersState(nextFilters);
        const filterMap = Object.fromEntries(
          nextFilters.map((f) => [f.id, f.value])
        );
        setSearchParams((prev) => ({ ...prev, ...filterMap, page: 1 }));
        // fire immediately
        queueMicrotask(() => rawFetchData());
      }}
    />
  );
}

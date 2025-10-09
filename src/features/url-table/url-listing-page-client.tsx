'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Urls } from '@prisma/client';
import { UrlTable } from './table';
import { getUrlColumns } from './columns';
import {
  useQueryStates,
  parseAsInteger,
  parseAsString,
  createParser
} from 'nuqs';
import { ColumnFiltersState, SortingState } from '@tanstack/react-table';

// ✅ Custom parser using `createParser` to enable `withDefault`
const parseSortParam = createParser<string[]>({
  parse: (value): string[] => {
    if (Array.isArray(value))
      return value.filter((entry) => typeof entry === 'string') as string[];
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((part) => part.trim())
        .filter((part) => part.length > 0);
    }
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

const sortingStatesEqual = (a: SortingState, b: SortingState) =>
  a.length === b.length &&
  a.every((item, index) => {
    const other = b[index];
    return other?.id === item.id && other?.desc === item.desc;
  });

const columnFiltersEqual = (a: ColumnFiltersState, b: ColumnFiltersState) =>
  a.length === b.length &&
  a.every((item, index) => {
    const other = b[index];
    return (
      other?.id === item.id &&
      JSON.stringify(other?.value) === JSON.stringify(item.value)
    );
  });

const parseSortingFromParams = (sort: string[]): SortingState =>
  sort
    .map((entry) => {
      if (typeof entry !== 'string') return null;
      const [id, direction] = entry.split(':');
      if (!id) return null;
      return { id, desc: direction === 'desc' };
    })
    .filter(Boolean) as SortingState;

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
  const [isFetching, setIsFetching] = useState(false);
  const activeRequestRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [sortingState, setSortingState] = useState<SortingState>([]);
  const [filtersState, setFiltersState] = useState<ColumnFiltersState>([]);

  const [searchParams, setSearchParams] = useQueryStates(searchParamDefs);
  const sortParam = searchParams.sort;
  const {
    url: urlFilter,
    metaTitle: metaTitleFilter,
    metaDescription: metaDescriptionFilter,
    canonical: canonicalFilter,
    h1: h1Filter,
    status: statusFilter
  } = searchParams;

  useEffect(() => {
    const parsedSorting = parseSortingFromParams(sortParam);
    setSortingState((prev) =>
      sortingStatesEqual(prev, parsedSorting) ? prev : parsedSorting
    );
  }, [sortParam]);

  useEffect(() => {
    const nextFilters = (
      [
        urlFilter && { id: 'url', value: urlFilter },
        metaTitleFilter && { id: 'metaTitle', value: metaTitleFilter },
        metaDescriptionFilter && {
          id: 'metaDescription',
          value: metaDescriptionFilter
        },
        canonicalFilter && { id: 'canonical', value: canonicalFilter },
        h1Filter && { id: 'h1', value: h1Filter },
        statusFilter && { id: 'status', value: statusFilter }
      ].filter(Boolean) as ColumnFiltersState
    ).map((filter) => ({ ...filter }));

    setFiltersState((prev) =>
      columnFiltersEqual(prev, nextFilters) ? prev : nextFilters
    );
  }, [
    urlFilter,
    metaTitleFilter,
    metaDescriptionFilter,
    canonicalFilter,
    h1Filter,
    statusFilter
  ]);

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

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const requestId = ++activeRequestRef.current;
    setIsFetching(true);

    try {
      const res = await fetch(urlPath, {
        cache: 'no-store',
        signal: controller.signal
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const data = await res.json();

      if (requestId === activeRequestRef.current) {
        setUrls(data.urls || []);
        setTotalItems(data.totalCount || 0);
      }
    } catch (error) {
      if (controller.signal.aborted) return;

      // eslint-disable-next-line no-console
      console.error('Failed to fetch URL data', error);
    } finally {
      if (requestId === activeRequestRef.current) {
        setIsFetching(false);
      }
    }
  }, [clientId, crawlId, searchParams]);

  useEffect(() => {
    void rawFetchData();
  }, [rawFetchData]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return (
    <UrlTable
      data={urls}
      totalItems={totalItems}
      columns={columns}
      initialPage={searchParams.page}
      initialPerPage={searchParams.perPage}
      isLoading={isFetching}
      onSortingChange={(updater) => {
        const nextSort =
          typeof updater === 'function'
            ? (updater as (old: SortingState) => SortingState)(sortingState)
            : updater;
        setSortingState(nextSort);
        const sortParams = nextSort.map(
          (s): string => `${s.id}:${s.desc ? 'desc' : 'asc'}`
        );
        void setSearchParams((prev) => ({
          ...prev,
          sort: sortParams,
          page: 1
        }));
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

        const removedFilters = filtersState
          .filter(
            (prevFilter) =>
              !nextFilters.some((filter) => filter.id === prevFilter.id)
          )
          .map((filter) => filter.id);

        void setSearchParams((prev) => {
          const next = { ...prev, page: 1 } as typeof prev;

          Object.entries(filterMap).forEach(([key, value]) => {
            next[key as keyof typeof next] = value as never;
          });

          removedFilters.forEach((key) => {
            next[key as keyof typeof next] = '' as never;
          });

          return next;
        });
      }}
    />
  );
}

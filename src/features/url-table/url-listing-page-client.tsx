'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  PaginationState,
  SortingState
} from '@tanstack/react-table';
import { toast } from 'sonner';

// Sort param stored as comma-separated "field:direction" entries
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
  serialize: (value: string[]): string => value.join(',')
});

const searchParamDefs = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),

  // Filters
  url: parseAsString.withDefault(''),
  metaTitle: parseAsString.withDefault(''),
  metaDescription: parseAsString.withDefault(''),
  canonical: parseAsString.withDefault(''),
  h1: parseAsString.withDefault(''),
  status: parseAsString.withDefault(''),

  // Sort
  sort: parseSortParam.withDefault([])
};

// Convert URL sort params ("field:dir") to TanStack SortingState
const parseSortingFromParams = (sort: string[]): SortingState =>
  sort
    .map((entry) => {
      if (typeof entry !== 'string') return null;
      const [id, direction] = entry.split(':');
      if (!id) return null;
      return { id, desc: direction === 'desc' };
    })
    .filter(Boolean) as SortingState;

// Convert URL filter params to TanStack ColumnFiltersState
const parseFiltersFromParams = (params: {
  url: string;
  metaTitle: string;
  metaDescription: string;
  canonical: string;
  h1: string;
  status: string;
}): ColumnFiltersState =>
  (
    [
      params.url && { id: 'url', value: params.url },
      params.metaTitle && { id: 'metaTitle', value: params.metaTitle },
      params.metaDescription && {
        id: 'metaDescription',
        value: params.metaDescription
      },
      params.canonical && { id: 'canonical', value: params.canonical },
      params.h1 && { id: 'h1', value: params.h1 },
      params.status && { id: 'status', value: params.status }
    ] as ColumnFiltersState
  ).filter(Boolean);

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

  const [searchParams, setSearchParams] = useQueryStates(searchParamDefs);

  // Derive TanStack state from URL params (single source of truth)
  const sorting = parseSortingFromParams(searchParams.sort);
  const columnFilters = parseFiltersFromParams(searchParams);
  const pagination: PaginationState = useMemo(
    () => ({
      pageIndex: searchParams.page - 1,
      pageSize: searchParams.perPage
    }),
    [searchParams.page, searchParams.perPage]
  );
  const pageCount = Math.ceil(totalItems / (searchParams.perPage || 1)) || 1;

  // --- Handlers: update URL params, which triggers re-fetch ---

  const handleSortingChange = useCallback(
    (updater: SortingState | ((old: SortingState) => SortingState)) => {
      const nextSort =
        typeof updater === 'function' ? updater(sorting) : updater;
      const sortParams = nextSort.map(
        (s): string => `${s.id}:${s.desc ? 'desc' : 'asc'}`
      );
      void setSearchParams((prev) => ({
        ...prev,
        sort: sortParams,
        page: 1
      }));
    },
    [sorting, setSearchParams]
  );

  const handleColumnFiltersChange = useCallback(
    (
      updater:
        | ColumnFiltersState
        | ((old: ColumnFiltersState) => ColumnFiltersState)
    ) => {
      const nextFilters =
        typeof updater === 'function' ? updater(columnFilters) : updater;

      const filterMap = Object.fromEntries(
        nextFilters.map((f) => [f.id, f.value])
      );

      // Detect removed filters to clear them
      const removedFilters = columnFilters
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
    },
    [columnFilters, setSearchParams]
  );

  const handlePaginationChange = useCallback(
    (
      updater: PaginationState | ((old: PaginationState) => PaginationState)
    ) => {
      const next =
        typeof updater === 'function' ? updater(pagination) : updater;
      void setSearchParams((prev) => ({
        ...prev,
        page: next.pageIndex + 1,
        perPage: next.pageSize
      }));
    },
    [pagination, setSearchParams]
  );

  // --- Data fetching: reads URL params, builds API query ---

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
      toast.error('Failed to load URLs', {
        description: 'Please try again later.'
      });
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
      pageCount={pageCount}
      pagination={pagination}
      sorting={sorting}
      columnFilters={columnFilters}
      onPaginationChange={handlePaginationChange}
      onSortingChange={handleSortingChange}
      onColumnFiltersChange={handleColumnFiltersChange}
      isLoading={isFetching}
    />
  );
}

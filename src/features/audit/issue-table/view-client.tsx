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
import {
  TitlesTooLong,
  TitlesTooShort,
  TitlesMissing
} from '../issue-descriptions/titles';
import {
  DescriptionsTooLong,
  DescriptionsTooShort,
  DescriptionsMissing
} from '../issue-descriptions/descriptions';
import {
  Heading1Missing,
  Heading2Missing,
  Heading3Missing,
  Heading4Missing,
  Heading5Missing,
  Heading6Missing,
  Heading1Multiple,
  Heading2Multiple,
  Heading3Multiple,
  Heading4Multiple,
  Heading5Multiple,
  Heading6Multiple,
  Heading1Duplicate,
  Heading2Duplicate,
  Heading3Duplicate,
  Heading4Duplicate,
  Heading5Duplicate,
  Heading6Duplicate
} from '../issue-descriptions/headings';

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
      {issueKey === 'too_long_title_urls' && <TitlesTooLong />}
      {issueKey === 'too_short_title_urls' && <TitlesTooShort />}
      {issueKey === 'pages_missing_title_urls' && <TitlesMissing />}
      {issueKey === 'too_long_description_urls' && <DescriptionsTooLong />}
      {issueKey === 'too_short_description_urls' && <DescriptionsTooShort />}
      {issueKey === 'pages_missing_description_urls' && <DescriptionsMissing />}
      {issueKey === 'pages_missing_h1_urls' && <Heading1Missing />}
      {issueKey === 'pages_missing_h2_urls' && <Heading2Missing />}
      {issueKey === 'pages_missing_h3_urls' && <Heading3Missing />}
      {issueKey === 'pages_missing_h4_urls' && <Heading4Missing />}
      {issueKey === 'pages_missing_h5_urls' && <Heading5Missing />}
      {issueKey === 'pages_missing_h6_urls' && <Heading6Missing />}
      {issueKey === 'pages_with_multiple_h1s_urls' && <Heading1Multiple />}
      {issueKey === 'pages_with_multiple_h2s_urls' && <Heading2Multiple />}
      {issueKey === 'pages_with_multiple_h3s_urls' && <Heading3Multiple />}
      {issueKey === 'pages_with_multiple_h4s_urls' && <Heading4Multiple />}
      {issueKey === 'pages_with_multiple_h5s_urls' && <Heading5Multiple />}
      {issueKey === 'pages_with_multiple_h6s_urls' && <Heading6Multiple />}
      {issueKey === 'pages_with_duplicate_h1s_urls' && <Heading1Duplicate />}
      {issueKey === 'pages_with_duplicate_h2s_urls' && <Heading2Duplicate />}
      {issueKey === 'pages_with_duplicate_h3s_urls' && <Heading3Duplicate />}
      {issueKey === 'pages_with_duplicate_h4s_urls' && <Heading4Duplicate />}
      {issueKey === 'pages_with_duplicate_h5s_urls' && <Heading5Duplicate />}
      {issueKey === 'pages_with_duplicate_h6s_urls' && <Heading6Duplicate />}

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

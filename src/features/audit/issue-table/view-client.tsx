'use client';

import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
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

    const urls = Array.isArray(result.issues)
      ? result.issues.map((issue: { id: number; url: string }) => issue)
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

  // --- CSV helpers ---
  const escapeCsv = (val: unknown) => {
    const s = String(val ?? '');
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };

  const rowsToCsv = (rows: { url: string }[]) => {
    const header = ['url'];
    const lines = [header.join(',')];
    for (const r of rows) lines.push([escapeCsv(r.url)].join(','));
    return lines.join('\n');
  };

  const exportCsv = async () => {
    // Fetch ALL rows for this issue (bypass pagination)
    const query = new URLSearchParams({
      page: '1',
      perPage: '100000',
      url: searchParams.url || ''
    });

    const res = await fetch(
      `/api/client/${clientId}/audits/issues/${issueKey}?${query.toString()}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return;
    const result = await res.json();
    const rows: { id: number; url: string }[] = Array.isArray(result.issues)
      ? result.issues
      : [];
    const csv = rowsToCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const urlObj = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = urlObj;
    a.download = `${issueKey}-urls.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(urlObj);
  };

  return (
    <div className='flex min-h-[calc(100vh-20rem)] flex-col space-y-4 p-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>
          {issueKey
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')}
        </h1>
        <Button
          variant='outline'
          size='sm'
          onClick={exportCsv}
          className='gap-2'
        >
          <Download className='h-4 w-4' /> Export CSV
        </Button>
      </div>
      {issueKey === 'too_long_title_urls' && <TitlesTooLong />}
      {issueKey === 'too_short_title' && <TitlesTooShort />}
      {issueKey === 'pages_missing_title' && <TitlesMissing />}
      {issueKey === 'too_long_description' && <DescriptionsTooLong />}
      {issueKey === 'too_short_description' && <DescriptionsTooShort />}
      {issueKey === 'pages_missing_description' && <DescriptionsMissing />}
      {issueKey === 'pages_missing_h1' && <Heading1Missing />}
      {issueKey === 'pages_missing_h2' && <Heading2Missing />}
      {issueKey === 'pages_missing_h3' && <Heading3Missing />}
      {issueKey === 'pages_missing_h4' && <Heading4Missing />}
      {issueKey === 'pages_missing_h5' && <Heading5Missing />}
      {issueKey === 'pages_missing_h6' && <Heading6Missing />}
      {issueKey === 'pages_with_multiple_h1s' && <Heading1Multiple />}
      {issueKey === 'pages_with_multiple_h2s' && <Heading2Multiple />}
      {issueKey === 'pages_with_multiple_h3s' && <Heading3Multiple />}
      {issueKey === 'pages_with_multiple_h4s' && <Heading4Multiple />}
      {issueKey === 'pages_with_multiple_h5s' && <Heading5Multiple />}
      {issueKey === 'pages_with_multiple_h6s' && <Heading6Multiple />}
      {issueKey === 'pages_with_duplicate_h1s' && <Heading1Duplicate />}
      {issueKey === 'pages_with_duplicate_h2s' && <Heading2Duplicate />}
      {issueKey === 'pages_with_duplicate_h3s' && <Heading3Duplicate />}
      {issueKey === 'pages_with_duplicate_h4s' && <Heading4Duplicate />}
      {issueKey === 'pages_with_duplicate_h5s' && <Heading5Duplicate />}
      {issueKey === 'pages_with_duplicate_h6s' && <Heading6Duplicate />}
      {}
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

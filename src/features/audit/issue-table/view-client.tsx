'use client';

import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { TaskCreateDialog } from '@/features/tasks/task-create-dialog';
import { Download, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useQueryStates,
  parseAsInteger,
  parseAsString,
  createParser
} from 'nuqs';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { AuditIssueTable } from './table';
import { getAuditIssueColumns } from './columns';
import type { AuditIssueRow } from './columns';
import {
  Updater,
  SortingState,
  ColumnFiltersState
} from '@tanstack/react-table';
import { toast } from 'sonner';
import { ISSUE_DESCRIPTION_MAP, getIssueByField } from '../lib/issue-registry';

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

interface AuditIssueViewClientProps {
  clientId: number;
  issueKey: string;
}

export default function AuditIssueViewClient({
  clientId,
  issueKey
}: AuditIssueViewClientProps) {
  const [data, setData] = useState<AuditIssueRow[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [isExporting, setIsExporting] = useState(false);

  const [searchParams, setSearchParams] = useQueryStates(searchParamDefs);

  const fetchData = useDebouncedCallback(async () => {
    const { page, perPage, url } = searchParams;

    const query = new URLSearchParams({
      page: String(page),
      perPage: String(perPage),
      url
    });

    const res = await fetch(
      `/api/clients/${clientId}/audits/issues/${issueKey}?${query.toString()}`
    );
    const result = await res.json();

    const isVirtual = result.isVirtual ?? false;
    const urls: AuditIssueRow[] = Array.isArray(result.issues)
      ? result.issues
          .map(
            (issue: {
              id: number;
              url: string | { url?: string; id?: number };
              urlId?: number;
              url_id?: number;
              urlIdFromJoin?: number;
              status?: string;
              priority?: string;
              isVirtual?: boolean;
            }) => ({
              id: Number(issue.id),
              url:
                typeof issue.url === 'string'
                  ? issue.url
                  : String(issue.url?.url ?? ''),
              urlId:
                issue.urlId ??
                issue.url_id ??
                issue.urlIdFromJoin ??
                (typeof issue.url === 'object' ? issue.url?.id : undefined),
              clientId,
              issueKey,
              status: issue.status as AuditIssueRow['status'],
              priority: issue.priority as AuditIssueRow['priority'],
              isVirtual: issue.isVirtual ?? isVirtual
            })
          )
          .filter((row: AuditIssueRow) => !!row.url)
      : [];

    setData(urls);
    setTotalItems(result.totalCount || 0);
  }, 300);

  const columns = getAuditIssueColumns(fetchData);

  useEffect(() => {
    startTransition(() => {
      fetchData();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setIsExporting(true);
    try {
      const query = new URLSearchParams({
        page: '1',
        perPage: '100000',
        url: searchParams.url || ''
      });

      const res = await fetch(
        `/api/clients/${clientId}/audits/issues/${issueKey}?${query.toString()}`,
        { cache: 'no-store' }
      );
      if (!res.ok) {
        toast.error('Failed to export CSV');
        return;
      }
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
      toast.success(`Exported ${rows.length} URLs`);
    } catch {
      toast.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  // --- Registry lookup ---
  const issue = getIssueByField(issueKey);
  const issueLabel =
    issue?.label ??
    issueKey
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  const DescComponent = ISSUE_DESCRIPTION_MAP[issueKey];

  return (
    <div className='flex min-h-[calc(100vh-20rem)] flex-col space-y-4 p-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>{issueLabel}</h1>
        <TaskCreateDialog
          clientId={clientId}
          defaultTitle={`Fix ${issueLabel.toLowerCase()}`}
        />
      </div>

      {/* Stats + Description row */}
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Affected URLs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalItems}</div>
            <p className='text-muted-foreground text-xs'>
              Pages requiring attention
            </p>
          </CardContent>
        </Card>

        {issue && (
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Severity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex items-center gap-2'>
                <div
                  className={`h-2.5 w-2.5 rounded-full ${
                    issue.severity === 'critical'
                      ? 'bg-red-500'
                      : issue.severity === 'warning'
                        ? 'bg-amber-500'
                        : issue.severity === 'opportunity'
                          ? 'bg-sky-500'
                          : 'bg-slate-400'
                  }`}
                />
                <span className='text-2xl font-bold capitalize'>
                  {issue.severity}
                </span>
              </div>
              <p className='text-muted-foreground text-xs'>
                {issue.severity === 'critical'
                  ? 'Requires immediate attention'
                  : issue.severity === 'warning'
                    ? 'Should be addressed soon'
                    : issue.severity === 'opportunity'
                      ? 'Improvement opportunity'
                      : 'For your information'}
              </p>
            </CardContent>
          </Card>
        )}

        {DescComponent && (
          <Card>
            <CardHeader>
              <CardTitle className='text-sm font-medium'>
                About This Issue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DescComponent />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Export + Table */}
      <div className='flex justify-end'>
        <Button
          variant='outline'
          size='sm'
          onClick={exportCsv}
          disabled={isExporting}
          className='gap-2'
        >
          {isExporting ? (
            <>
              <Loader2 className='h-4 w-4 animate-spin' /> Exporting...
            </>
          ) : (
            <>
              <Download className='h-4 w-4' /> Export CSV
            </>
          )}
        </Button>
      </div>

      <div
        className={
          isPending ? 'pointer-events-none opacity-50 transition-opacity' : ''
        }
      >
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
            setSearchParams((prev) => ({ ...prev, ...filterMap, page: 1 }));
          }}
        />
      </div>
    </div>
  );
}

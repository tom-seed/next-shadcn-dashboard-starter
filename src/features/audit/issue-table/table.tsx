'use client';

import {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  OnChangeFn,
  ColumnResizeMode,
  ColumnResizeDirection
} from '@tanstack/react-table';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useDataTable } from '@/hooks/use-data-table';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useState } from 'react';
import { getAuditIssueColumns } from './columns';

interface AuditTableProps<TData, TValue> {
  data: TData[];
  totalItems: number;
  columns: ColumnDef<TData, TValue>[];
  initialPage: number;
  initialPerPage: number;
  onSortingChange?: OnChangeFn<SortingState>;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
}

export function AuditIssueTable<TData, TValue>({
  data,
  totalItems,
  columns,
  initialPage,
  initialPerPage,
  onSortingChange,
  onColumnFiltersChange
}: AuditTableProps<TData, TValue>) {
  const [perPage] = useQueryState(
    'perPage',
    parseAsInteger.withDefault(initialPerPage)
  );
  const pageCount = Math.ceil(totalItems / (perPage || 1)) || 1;

  const [columnVisibility, setColumnVisibility] = useState({});
  const [columnSizing, setColumnSizing] = useState({});
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [columnResizeMode] = useState<ColumnResizeMode>('onChange');
  const [columnResizeDirection] = useState<ColumnResizeDirection>('ltr');

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    initialState: {
      pagination: {
        pageIndex: initialPage - 1,
        pageSize: initialPerPage
      },
      columnVisibility,
      columnSizing,
      columnOrder
    },
    shallow: false,
    debounceMs: 500,
    enableSorting: true,
    enableColumnFilters: true,
    columnResizeMode,
    columnResizeDirection,
    onSortingChange,
    onColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    onColumnOrderChange: setColumnOrder
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}

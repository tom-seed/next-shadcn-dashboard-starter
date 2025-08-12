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
import { useState, useReducer } from 'react';

interface UrlTableProps<TData, TValue> {
  data: TData[];
  totalItems: number;
  columns: ColumnDef<TData, TValue>[];
  initialPage: number;
  initialPerPage: number;
  onSortingChange?: OnChangeFn<SortingState>;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
}

export function UrlTable<TData, TValue>({
  data,
  totalItems,
  columns,
  initialPage,
  initialPerPage,
  onSortingChange,
  onColumnFiltersChange
}: UrlTableProps<TData, TValue>) {
  const [perPage] = useQueryState(
    'perPage',
    parseAsInteger.withDefault(initialPerPage)
  );
  const pageCount = Math.ceil(totalItems / (perPage || 1)) || 1;

  const [columnVisibility, setColumnVisibility] = useState({});
  const [columnSizing, setColumnSizing] = useState<Record<string, number>>({
    url: 420,
    metaTitle: 280,
    metaDescription: 420,
    canonical: 360,
    status: 120
  });
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [columnResizeMode, setColumnResizeMode] =
    useState<ColumnResizeMode>('onChange');
  const [columnResizeDirection, setColumnResizeDirection] =
    useState<ColumnResizeDirection>('ltr');

  const rerender = useReducer(() => ({}), {})[1];

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
    enableMultiSort: true,
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

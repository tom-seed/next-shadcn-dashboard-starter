'use client';

import {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  OnChangeFn,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  useReactTable
} from '@tanstack/react-table';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useState } from 'react';

interface UrlTableProps<TData, TValue> {
  data: TData[];
  totalItems: number;
  columns: ColumnDef<TData, TValue>[];
  pageCount: number;
  pagination: { pageIndex: number; pageSize: number };
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  onPaginationChange: OnChangeFn<{ pageIndex: number; pageSize: number }>;
  onSortingChange: OnChangeFn<SortingState>;
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
  isLoading?: boolean;
}

export function UrlTable<TData, TValue>({
  data,
  totalItems,
  columns,
  pageCount,
  pagination,
  sorting,
  columnFilters,
  onPaginationChange,
  onSortingChange,
  onColumnFiltersChange,
  isLoading = false
}: UrlTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] = useState({});
  const [columnSizing, setColumnSizing] = useState<Record<string, number>>({
    url: 420,
    metaTitle: 280,
    metaDescription: 420,
    canonical: 360,
    status: 120
  });

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      pagination,
      sorting,
      columnFilters,
      columnVisibility,
      columnSizing
    },
    onPaginationChange,
    onSortingChange,
    onColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    columnResizeMode: 'onChange',
    columnResizeDirection: 'ltr',
    enableSorting: true,
    enableMultiSort: true,
    enableColumnFilters: true,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues()
  });

  return (
    <DataTable table={table} totalItems={totalItems} aria-busy={isLoading}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}

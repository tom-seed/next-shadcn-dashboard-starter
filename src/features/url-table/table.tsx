'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  OnChangeFn
} from '@tanstack/react-table';
import { parseAsInteger, useQueryState } from 'nuqs';

interface UrlTableProps<TData, TValue> {
  data: TData[];
  totalItems: number;
  columns: ColumnDef<TData, TValue>[];
  initialPage: number;
  initialPerPage: number;
  onSortingChange?: OnChangeFn<SortingState>; // ✅ Use OnChangeFn
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>; // ✅ Use OnChangeFn
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

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    initialState: {
      pagination: {
        pageIndex: initialPage - 1,
        pageSize: initialPerPage
      }
    },
    shallow: false,
    debounceMs: 500,
    onSortingChange, // ✅ just pass it through
    onColumnFiltersChange // ✅ just pass it through
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}

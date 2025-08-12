// FILE: src/features/url-table/columns.tsx
'use client';

import { UrlCellAction } from './cell-action';
import { ColumnDef } from '@tanstack/react-table';
import { Urls } from '@prisma/client';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Text } from 'lucide-react';
import { Option } from '@/types/data-table';

const STATUS_OPTIONS: Option[] = [
  { label: '200 OK', value: '200' },
  { label: '3xx Redirect', value: '300' },
  { label: '4xx Client Error', value: '400' },
  { label: '5xx Server Error', value: '500' }
];

// Normalise H1 to a string so the table can display & filter reliably
function normalizeH1(value: unknown): string {
  if (value == null) return '';
  // If it's already a string
  if (typeof value === 'string') {
    // Try to detect a JSON-encoded array string
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.join(' | ');
    } catch (_) {
      // not JSON; just return raw string
    }
    return value;
  }
  // If it's an array (string[])
  if (Array.isArray(value)) {
    return (value as unknown[]).map(String).join(' | ');
  }
  // If it's a JSON object that might have an array inside (e.g., Prisma JSON)
  if (typeof value === 'object') {
    // Look for common shapes like { h1: [...] } or similar
    const maybeArr = (value as any).h1 ?? (value as any).value ?? value;
    if (Array.isArray(maybeArr)) return maybeArr.map(String).join(' | ');
  }
  return String(value);
}

export function getUrlColumns(
  clientId: number
): ColumnDef<Urls, string | number | null>[] {
  return [
    {
      id: 'url',
      accessorKey: 'url',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='URL' />
      ),
      cell: ({ cell }) => (
        <span
          className='block max-w-[400px] truncate'
          title={cell.getValue<string>() || 'N/A'}
        >
          {cell.getValue<string>() || 'N/A'}
        </span>
      ),
      enableColumnFilter: true,
      enableSorting: true,
      enableResizing: true,
      enableHiding: true,
      enablePinning: true,
      sortUndefined: 'last',
      sortDescFirst: false,
      meta: {
        label: 'URL',
        variant: 'text',
        icon: Text
      }
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Status' />
      ),
      cell: ({ cell }) => <span>{(cell.getValue() as number) ?? 'N/A'}</span>,
      enableColumnFilter: true,
      enableSorting: true,
      enableResizing: true,
      sortDescFirst: true,
      meta: {
        label: 'Status',
        variant: 'select',
        options: STATUS_OPTIONS
      }
    },
    {
      id: 'canonical',
      accessorKey: 'canonical',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Canonical' />
      ),
      cell: ({ cell }) => <span>{(cell.getValue() as string) || 'N/A'}</span>,
      enableColumnFilter: true,
      enableSorting: true,
      enableResizing: true,
      enableHiding: true,
      enablePinning: true,
      sortUndefined: 'last',
      sortDescFirst: false,
      meta: {
        label: 'Canonical',
        variant: 'text',
        icon: Text
      }
    },
    {
      id: 'metaTitle',
      accessorKey: 'metaTitle',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Meta Title' />
      ),
      cell: ({ cell }) => <span>{(cell.getValue() as string) || 'N/A'}</span>,
      enableColumnFilter: true,
      enableSorting: true,
      enableResizing: true,
      enableHiding: true,
      enablePinning: true,
      sortUndefined: 'last',
      sortDescFirst: false,
      meta: {
        label: 'Meta Title',
        variant: 'text',
        icon: Text
      }
    },
    {
      id: 'metaDescription',
      accessorKey: 'metaDescription',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Meta Description' />
      ),
      cell: ({ cell }) => (
        <span
          className='block max-w-[400px] truncate'
          title={cell.getValue<string>() || 'N/A'}
        >
          {cell.getValue<string>() || 'N/A'}
        </span>
      ),
      enableColumnFilter: true,
      enableSorting: true,
      enableResizing: true,
      enableHiding: true,
      enablePinning: true,
      sortUndefined: 'last',
      sortDescFirst: false,
      meta: {
        label: 'Meta Description',
        variant: 'text',
        icon: Text
      }
    },
    {
      id: 'h1',
      accessorFn: (row) => normalizeH1((row as any).h1),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='H1' />
      ),
      cell: ({ cell }) => (
        <span
          className='block max-w-[400px] truncate'
          title={(cell.getValue() as string) || 'N/A'}
        >
          {(cell.getValue() as string) || 'N/A'}
        </span>
      ),
      enableColumnFilter: true,
      enableSorting: true,
      enableResizing: true,
      enableHiding: true,
      enablePinning: true,
      sortUndefined: 'last',
      sortDescFirst: false,
      meta: {
        label: 'H1',
        variant: 'text',
        icon: Text
      }
    },
    {
      id: 'actions',
      header: () => null,
      cell: ({ row }) => (
        <UrlCellAction data={row.original} clientId={clientId} />
      )
    }
  ];
}

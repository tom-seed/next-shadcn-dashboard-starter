// ✅ FILE: src/features/url-table/columns.tsx
'use client';

import { UrlCellAction } from './cell-action';
import { Column, ColumnDef } from '@tanstack/react-table';
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
      cell: ({ cell }) => <span>{cell.getValue<string>() || 'N/A'}</span>,
      enableColumnFilter: true,
      enableSorting: true,
      meta: {
        label: 'Search URL...',
        variant: 'text',
        icon: Text
      }
    },
    {
      id: 'status',
      accessorFn: (row): number | null => row.status,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Status' />
      ),
      cell: ({ cell }) => <span>{(cell.getValue() as number) ?? 'N/A'}</span>,
      enableColumnFilter: true,
      enableSorting: true,
      meta: {
        label: 'Status',
        variant: 'select',
        options: STATUS_OPTIONS
      }
    },
    {
      id: 'metaTitle',
      accessorFn: (row): string | null => row.metaTitle,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Meta Title' />
      ),
      cell: ({ cell }) => <span>{(cell.getValue() as string) || 'N/A'}</span>,
      enableColumnFilter: true,
      enableSorting: true,
      meta: {
        label: 'Search meta title...',
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

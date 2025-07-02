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
      enableHiding: true,
      enablePinning: true,
      sortUndefined: 'last',
      sortDescFirst: false,
      meta: {
        label: 'Search URL...',
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
      meta: {
        label: 'Status',
        variant: 'select',
        options: STATUS_OPTIONS
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
        label: 'Search meta title...',
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
        label: 'Search meta description...',
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

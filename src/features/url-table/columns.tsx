'use client';

import { UrlCellAction } from './cell-action';
import { ColumnDef } from '@tanstack/react-table';
import { Urls } from '@prisma/client';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';

export function getUrlColumns(
  clientId: number
): ColumnDef<Urls, string | number | null>[] {
  return [
    {
      id: 'url',
      accessorFn: (row: Urls): string => row.url,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='URL' />
      ),
      cell: ({ cell }) => <span>{(cell.getValue() as string) || 'N/A'}</span>,
      enableColumnFilter: true
    },
    {
      id: 'status',
      accessorFn: (row): number | null => row.status,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Status' />
      ),
      cell: ({ cell }) => <span>{(cell.getValue() as number) ?? 'N/A'}</span>,
      enableColumnFilter: true
    },
    {
      id: 'metaTitle',
      accessorFn: (row): string | null => row.metaTitle,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Meta Title' />
      ),
      cell: ({ cell }) => <span>{(cell.getValue() as string) || 'N/A'}</span>,
      enableColumnFilter: true
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

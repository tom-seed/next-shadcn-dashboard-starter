'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Text } from 'lucide-react';

export interface AuditIssueRow {
  id: number;
  url: string;
}

export function getAuditIssueColumns(): ColumnDef<
  AuditIssueRow,
  string | number | null
>[] {
  return [
    {
      accessorKey: 'url',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='URL' />
      ),
      cell: ({ getValue }) => {
        const url = getValue<string>();
        return (
          <span className='block max-w-[600px] truncate' title={url}>
            {url}
          </span>
        );
      },
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
    }
  ];
}

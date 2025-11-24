'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Text } from 'lucide-react';
import { UrlCellAction } from './cell-action';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { IssuePriority, IssueStatus } from '@prisma/client';

export interface AuditIssueRow {
  id: number;
  url: string;
  urlId?: number;
  clientId: number;
  status?: IssueStatus;
  priority?: IssuePriority;
}

export function getAuditIssueColumns(
  onUpdate?: () => void
): ColumnDef<AuditIssueRow, any>[] {
  return [
    {
      accessorKey: 'url',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='URL' />
      ),
      cell: ({ getValue }) => {
        const url = getValue<string>();
        return (
          <span className='block max-w-[500px] truncate' title={url}>
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
    },
    {
      accessorKey: 'priority',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Priority' />
      ),
      cell: ({ row }) => {
        const priority = row.original.priority;
        if (!priority) return <span className='text-muted-foreground'>-</span>;

        const colors: Record<string, string> = {
          CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
          MEDIUM:
            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
          LOW: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        };
        return (
          <Badge className={colors[priority] || ''} variant='outline'>
            {priority}
          </Badge>
        );
      },
      enableSorting: true
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Status' />
      ),
      cell: ({ row }) => {
        const status = row.original.status;
        if (!status) return <span className='text-muted-foreground'>-</span>;

        const colors: Record<string, string> = {
          OPEN: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
          IN_PROGRESS:
            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          FIXED:
            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          IGNORED:
            'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
        };
        return (
          <Badge className={colors[status] || ''} variant='outline'>
            {status.replace('_', ' ')}
          </Badge>
        );
      },
      enableSorting: true
    },
    {
      id: 'actions',
      header: () => null,
      cell: ({ row }) => {
        const task = row.original;

        // Only show actions if it's a real task (has status/priority)
        if (!task.status) {
          return <UrlCellAction clientId={task.clientId} urlId={task.urlId} />;
        }

        const updateTask = async (updates: {
          status?: IssueStatus;
          priority?: IssuePriority;
        }) => {
          try {
            const res = await fetch(`/api/clients/${task.clientId}/tasks`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ids: [task.id],
                ...updates
              })
            });

            if (!res.ok) throw new Error('Failed to update');

            toast.success('Task updated');
            if (onUpdate) onUpdate();
          } catch (error) {
            toast.error('Failed to update task');
          }
        };

        return (
          <div className='flex items-center gap-2'>
            <UrlCellAction clientId={task.clientId} urlId={task.urlId} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' className='h-8 w-8 p-0'>
                  <span className='sr-only'>Open menu</span>
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuLabel>Task Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Set Status</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={task.status}
                      onValueChange={(val) =>
                        updateTask({ status: val as IssueStatus })
                      }
                    >
                      <DropdownMenuRadioItem value='OPEN'>
                        Open
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value='IN_PROGRESS'>
                        In Progress
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value='FIXED'>
                        Fixed
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value='IGNORED'>
                        Ignored
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Set Priority</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={task.priority}
                      onValueChange={(val) =>
                        updateTask({ priority: val as IssuePriority })
                      }
                    >
                      <DropdownMenuRadioItem value='CRITICAL'>
                        Critical
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value='HIGH'>
                        High
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value='MEDIUM'>
                        Medium
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value='LOW'>
                        Low
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      }
    }
  ];
}

'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
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
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Define the Task type matching the API response
export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigneeClerkUserId: string | null;
  createdAt: string;
  updatedAt: string;
  url?: { url: string } | null;
  auditIssue?: { issueKey: string } | null;
}

export const getTaskColumns = (
  clientId: number,
  onUpdate: () => void
): ColumnDef<Task>[] => [
  {
    accessorKey: 'title',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Title
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <Link
          href={`/dashboard/${clientId}/tasks/${row.original.id}`}
          className='font-medium hover:underline'
        >
          {row.getValue('title')}
        </Link>
      );
    }
  },
  {
    accessorKey: 'url',
    header: 'URL',
    cell: ({ row }) => {
      const urlObj = row.original.url;
      if (!urlObj)
        return <span className='text-muted-foreground text-xs'>N/A</span>;
      return (
        <Link
          href={`/dashboard/${clientId}/urls/${row.original.url?.url}`} // Ideally link to ID if available, but url object might only have url string
          className='block max-w-[200px] truncate text-xs text-blue-600 hover:underline'
          title={urlObj.url}
        >
          {urlObj.url}
        </Link>
      );
    }
  },
  {
    accessorKey: 'priority',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Priority
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({ row }) => {
      const priority = row.getValue('priority') as string;
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
    }
  },
  {
    accessorKey: 'status',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Status
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
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
    }
  },
  {
    accessorKey: 'assigneeClerkUserId',
    header: 'Assignee',
    cell: ({ row }) => {
      const assignee = row.getValue('assigneeClerkUserId') as string | null;
      return (
        <span className='text-muted-foreground text-sm'>
          {assignee ? 'Assigned' : 'Unassigned'}
        </span>
      );
    }
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Created
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({ row }) => {
      return format(new Date(row.getValue('createdAt')), 'MMM d, yyyy');
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const task = row.original;

      const updateTask = async (updates: Partial<Task>) => {
        try {
          const res = await fetch(`/api/clients/${clientId}/tasks`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ids: [task.id],
              ...updates
            })
          });

          if (!res.ok) throw new Error('Failed to update');

          toast.success('Task updated');
          onUpdate();
        } catch (error) {
          toast.error('Failed to update task');
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Open menu</span>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(task.id.toString())}
            >
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/${clientId}/tasks/${task.id}`}>
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Set Status</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={task.status}
                  onValueChange={(val) => updateTask({ status: val })}
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
                  onValueChange={(val) => updateTask({ priority: val })}
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
                  <DropdownMenuRadioItem value='LOW'>Low</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  }
];

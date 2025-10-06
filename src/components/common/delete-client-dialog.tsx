'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';

interface DeleteClientDialogProps {
  clientId: number;
  clientName: string;
  trigger?: React.ReactNode;
}

export function DeleteClientDialog({
  clientId,
  clientName,
  trigger
}: DeleteClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/clients/${clientId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to delete client');
        }

        toast.success('Client deleted', {
          description: `${clientName} has been permanently deleted.`
        });

        setOpen(false);

        // Redirect to overview page after successful deletion
        router.push('/dashboard/overview');
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to delete client';
        toast.error('Unable to delete client', { description: message });
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{' '}
            <span className='font-semibold'>{clientName}</span> and remove all
            associated data including audits, crawls, URLs, and issues.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isPending}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            {isPending ? 'Deleting...' : 'Delete Client'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { inviteUserAction } from '@/lib/client-actions';
import type { ClientRole } from '@prisma/client';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  role: z.enum(['CLIENT_ADMIN', 'CLIENT_VIEWER'])
});

type FormValues = z.infer<typeof schema>;

interface InviteUserDialogProps {
  clientId: number;
  trigger?: React.ReactNode;
}

export function InviteUserDialog({ clientId, trigger }: InviteUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'CLIENT_VIEWER' }
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      try {
        await inviteUserAction({
          clientId,
          email: values.email,
          role: values.role as Extract<
            ClientRole,
            'CLIENT_ADMIN' | 'CLIENT_VIEWER'
          >
        });
        toast.success('Invite sent', {
          description: `${values.email} will receive a Clerk organization invite.`
        });
        form.reset({ email: '', role: 'CLIENT_VIEWER' });
        setOpen(false);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to send invite';
        toast.error('Unable to invite', { description: message });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant='outline'>Invite User</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Client Collaborator</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder='client@example.com' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='role'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select role' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='CLIENT_ADMIN'>Client Admin</SelectItem>
                      <SelectItem value='CLIENT_VIEWER'>
                        Client Viewer
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type='submit' disabled={isPending}>
                {isPending ? 'Sending…' : 'Send Invite'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

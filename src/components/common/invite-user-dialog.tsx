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
import { EmailMultiInput } from '@/components/ui/email-multi-input';
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
  emails: z
    .array(z.string().email('Enter a valid email'))
    .min(1, 'Add at least one email'),
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
    defaultValues: { emails: [], role: 'CLIENT_VIEWER' }
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      try {
        const result = await Promise.all(
          values.emails.map((email) =>
            inviteUserAction({
              clientId,
              email,
              role: values.role as Extract<
                ClientRole,
                'CLIENT_ADMIN' | 'CLIENT_VIEWER'
              >
            })
          )
        );

        const successCount = result.filter((r) => r.ok).length;

        if (successCount > 0) {
          toast.success('Invites processed', {
            description: `${successCount} invite(s) sent successfully.`
          });
          form.reset({ emails: [], role: 'CLIENT_VIEWER' });
          setOpen(false);
        }
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
              name='emails'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invite emails</FormLabel>
                  <FormControl>
                    <EmailMultiInput
                      value={field.value ?? []}
                      onChange={(emails) =>
                        form.setValue('emails', emails, {
                          shouldDirty: true,
                          shouldValidate: true
                        })
                      }
                      disabled={isPending}
                      aria-describedby={field.name}
                    />
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
                {isPending ? 'Sending…' : 'Send invites'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DeleteClientDialog } from '@/components/common/delete-client-dialog';
import { InviteUserDialog } from '@/components/common/invite-user-dialog';
import { IconTrash, IconDeviceFloppy, IconUserPlus } from '@tabler/icons-react';

const clientSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  url: z.string().url('Must be a valid URL').or(z.literal('')),
  cron: z.string().optional()
});

type FormValues = z.infer<typeof clientSchema>;

interface ClientSettingsFormProps {
  client: {
    id: number;
    name: string;
    url: string | null;
    cron: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

export function ClientSettingsForm({ client }: ClientSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client.name,
      url: client.url || '',
      cron: client.cron || ''
    }
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/clients/${client.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: values.name,
            url: values.url || null,
            cron: values.cron || null
          })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update client');
        }

        toast.success('Client updated', {
          description: 'Your changes have been saved successfully.'
        });

        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to update client';
        toast.error('Unable to update client', { description: message });
      }
    });
  };

  const hasChanges = form.formState.isDirty;

  return (
    <div className='space-y-6'>
      {/* General Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Update your client&apos;s basic information and configuration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Name</FormLabel>
                    <FormControl>
                      <Input placeholder='My Client' {...field} />
                    </FormControl>
                    <FormDescription>
                      The display name for this client.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='url'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='https://example.com'
                        type='url'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The primary website URL for this client.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='cron'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cron Schedule (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder='0 0 * * *' {...field} />
                    </FormControl>
                    <FormDescription>
                      Cron expression for automated crawls (e.g., &quot;0 0 * *
                      *&quot; for daily at midnight).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='flex justify-end'>
                <Button
                  type='submit'
                  disabled={isPending || !hasChanges}
                  className='min-w-[120px]'
                >
                  {isPending ? (
                    'Saving...'
                  ) : (
                    <>
                      <IconDeviceFloppy className='mr-2 h-4 w-4' />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Team Management Card */}
      <Card>
        <CardHeader>
          <CardTitle>Team Management</CardTitle>
          <CardDescription>
            Invite team members to collaborate on this client.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-between rounded-lg border p-4'>
            <div className='space-y-1'>
              <p className='text-sm font-medium'>Invite team members</p>
              <p className='text-muted-foreground text-sm'>
                Send invitations to collaborate on {client.name}. They will
                receive an email with instructions to join.
              </p>
            </div>
            <InviteUserDialog
              clientId={client.id}
              trigger={
                <Button variant='outline' size='sm'>
                  <IconUserPlus className='mr-2 h-4 w-4' />
                  Invite User
                </Button>
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone Card */}
      <Card className='border-destructive/50'>
        <CardHeader>
          <CardTitle className='text-destructive'>Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that will permanently affect this client.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='border-destructive/20 bg-destructive/5 flex items-center justify-between rounded-lg border p-4'>
            <div className='space-y-1'>
              <p className='text-sm font-medium'>Delete this client</p>
              <p className='text-muted-foreground text-sm'>
                Once you delete a client, there is no going back. This will
                permanently delete all audits, crawls, and associated data.
              </p>
            </div>
            <DeleteClientDialog
              clientId={client.id}
              clientName={client.name}
              trigger={
                <Button variant='destructive' size='sm'>
                  <IconTrash className='mr-2 h-4 w-4' />
                  Delete Client
                </Button>
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Metadata Card */}
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
          <CardDescription>
            Information about this client&apos;s history.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-2'>
          <div className='flex justify-between text-sm'>
            <span className='text-muted-foreground'>Client ID:</span>
            <span className='font-mono'>{client.id}</span>
          </div>
          <Separator />
          <div className='flex justify-between text-sm'>
            <span className='text-muted-foreground'>Created:</span>
            <span>{new Date(client.createdAt).toLocaleString()}</span>
          </div>
          <Separator />
          <div className='flex justify-between text-sm'>
            <span className='text-muted-foreground'>Last Updated:</span>
            <span>{new Date(client.updatedAt).toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

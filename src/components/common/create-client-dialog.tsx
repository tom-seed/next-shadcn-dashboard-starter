'use client';

import { useState, useTransition } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { createClientAction, inviteUserAction } from '@/lib/client-actions';
import type { ClientRole } from '@prisma/client';

const clientSchema = z.object({
  name: z.string().min(2, 'Client name is required'),
  url: z.string().url('Enter a valid URL'),
  startCrawl: z.boolean().default(true),
  cron: z.string().optional()
});

const inviteSchema = z.object({
  email: z.string().email('Enter a valid email'),
  role: z.enum(['CLIENT_ADMIN', 'CLIENT_VIEWER'])
});

type ClientFormValues = z.infer<typeof clientSchema>;
type InviteFormValues = z.infer<typeof inviteSchema>;

export function CreateClientDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'create' | 'invite'>('create');
  const [createdClientId, setCreatedClientId] = useState<number | null>(null);
  const [createdClientName, setCreatedClientName] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isInvitePending, startInviteTransition] = useTransition();
  const router = useRouter();

  const clientForm = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: { startCrawl: true }
  });

  const inviteForm = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'CLIENT_VIEWER' }
  });

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setStep('create');
      setCreatedClientId(null);
      setCreatedClientName('');
      clientForm.reset({ startCrawl: true });
      inviteForm.reset({ email: '', role: 'CLIENT_VIEWER' });
    }, 200);
  };

  const onSubmitClient = (values: ClientFormValues) => {
    startTransition(async () => {
      try {
        const response = await createClientAction(values);
        setCreatedClientId(response.clientId);
        setCreatedClientName(values.name);
        toast.success('Client created', {
          description: 'Organization and crawl have been scheduled.'
        });
        inviteForm.reset({ email: '', role: 'CLIENT_VIEWER' });
        setStep('invite');
      } catch (error: unknown) {
        const message = (error as Error)?.message || 'Failed to create client.';
        toast.error('Unable to create client', { description: message });
      }
    });
  };

  const onSubmitInvite = (values: InviteFormValues) => {
    if (!createdClientId) return;

    startInviteTransition(async () => {
      try {
        await inviteUserAction({
          clientId: createdClientId,
          email: values.email,
          role: values.role as Extract<
            ClientRole,
            'CLIENT_ADMIN' | 'CLIENT_VIEWER'
          >
        });
        toast.success('Invite sent', {
          description: `${values.email} will receive a Clerk organization invite.`
        });
        handleClose();
        router.push(`/dashboard/${createdClientId}/overview`);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to send invite';
        toast.error('Unable to invite', { description: message });
      }
    });
  };

  const handleSkip = () => {
    if (createdClientId) {
      handleClose();
      router.push(`/dashboard/${createdClientId}/overview`);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => !isPending && !isInvitePending && setOpen(value)}
    >
      <DialogTrigger asChild>
        <Button size='lg' disabled={isPending}>
          {isPending ? 'Creating…' : 'New Client'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        {step === 'create' ? (
          <>
            <DialogHeader>
              <DialogTitle>Register a Client</DialogTitle>
            </DialogHeader>
            <Form {...clientForm}>
              <form
                onSubmit={clientForm.handleSubmit(onSubmitClient)}
                className='space-y-6'
              >
                <FormField
                  control={clientForm.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Name</FormLabel>
                      <FormControl>
                        <Input placeholder='Acme Retail' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={clientForm.control}
                  name='url'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Domain</FormLabel>
                      <FormControl>
                        <Input placeholder='https://example.com' {...field} />
                      </FormControl>
                      <FormDescription>
                        Used for the first crawl and dashboard linking.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={clientForm.control}
                  name='cron'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CRON Schedule (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder='0 3 * * 1' {...field} />
                      </FormControl>
                      <FormDescription>
                        Backend will manage recurring crawl cadence.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={clientForm.control}
                  name='startCrawl'
                  render={({ field }) => (
                    <FormItem className='flex items-center justify-between rounded-lg border p-4'>
                      <div className='space-y-0.5'>
                        <FormLabel>Kick off crawl after creation</FormLabel>
                        <FormDescription>
                          We will proxy to the backend to start the first crawl.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isPending}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type='submit' disabled={isPending}>
                    {isPending ? 'Creating…' : 'Create Client'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Invite a Team Member</DialogTitle>
              <DialogDescription>
                Invite someone to collaborate on {createdClientName}. You can
                skip this step and invite people later.
              </DialogDescription>
            </DialogHeader>
            <Form {...inviteForm}>
              <form
                onSubmit={inviteForm.handleSubmit(onSubmitInvite)}
                className='space-y-4'
              >
                <FormField
                  control={inviteForm.control}
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
                  control={inviteForm.control}
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
                          <SelectItem value='CLIENT_ADMIN'>
                            Client Admin
                          </SelectItem>
                          <SelectItem value='CLIENT_VIEWER'>
                            Client Viewer
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className='gap-2 sm:gap-0'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={handleSkip}
                    disabled={isInvitePending}
                  >
                    Skip for now
                  </Button>
                  <Button type='submit' disabled={isInvitePending}>
                    {isInvitePending ? 'Sending…' : 'Send Invite'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

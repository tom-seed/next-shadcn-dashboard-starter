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
import { createClientAction } from '@/lib/client-actions';

const schema = z.object({
  name: z.string().min(2, 'Client name is required'),
  url: z.string().url('Enter a valid URL'),
  startCrawl: z.boolean().default(true),
  cron: z.string().optional()
});

type FormValues = z.infer<typeof schema>;

export function CreateClientDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { startCrawl: true }
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      try {
        const response = await createClientAction(values);
        toast.success('Client created', {
          description: 'Organization and crawl have been scheduled.'
        });
        setOpen(false);
        form.reset();
        router.push(response.redirectUrl);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to create client.';
        toast.error('Unable to create client', { description: message });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size='lg'>New Client</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register a Client</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <FormField
              control={form.control}
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
              control={form.control}
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
              control={form.control}
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
              control={form.control}
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
      </DialogContent>
    </Dialog>
  );
}

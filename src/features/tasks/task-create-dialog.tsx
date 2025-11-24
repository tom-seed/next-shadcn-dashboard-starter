'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { IconPlus } from '@tabler/icons-react';

interface TaskCreateDialogProps {
  clientId: number;
  urlId?: number;
  auditIssueId?: number;
  defaultTitle?: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function TaskCreateDialog({
  clientId,
  urlId,
  auditIssueId,
  defaultTitle = '',
  trigger,
  onSuccess
}: TaskCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useUser();

  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [status, setStatus] = useState('OPEN');
  const [assignee, setAssignee] = useState<string>('unassigned');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/clients/${clientId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          description,
          priority,
          status,
          assigneeClerkUserId: assignee === 'me' ? user?.id : null,
          urlId,
          auditIssueId
        })
      });

      if (!res.ok) {
        throw new Error('Failed to create task');
      }

      const task = await res.json();
      toast.success('Task created successfully');
      setOpen(false);

      // Reset form
      setTitle(defaultTitle);
      setDescription('');
      setPriority('MEDIUM');
      setStatus('OPEN');
      setAssignee('unassigned');

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/dashboard/${clientId}/tasks/${task.id}`);
      }
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size='sm'>
            <IconPlus className='mr-2 h-4 w-4' />
            Create Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to track work items.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='grid gap-4 py-4'>
          <div className='grid gap-2'>
            <Label htmlFor='title'>Title</Label>
            <Input
              id='title'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='Task title'
              required
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='description'>Description</Label>
            <Textarea
              id='description'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Add details...'
            />
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div className='grid gap-2'>
              <Label htmlFor='priority'>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id='priority'>
                  <SelectValue placeholder='Select priority' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='LOW'>Low</SelectItem>
                  <SelectItem value='MEDIUM'>Medium</SelectItem>
                  <SelectItem value='HIGH'>High</SelectItem>
                  <SelectItem value='CRITICAL'>Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='status'>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id='status'>
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='OPEN'>Open</SelectItem>
                  <SelectItem value='IN_PROGRESS'>In Progress</SelectItem>
                  <SelectItem value='FIXED'>Fixed</SelectItem>
                  <SelectItem value='IGNORED'>Ignored</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='assignee'>Assignee</Label>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger id='assignee'>
                <SelectValue placeholder='Select assignee' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='unassigned'>Unassigned</SelectItem>
                <SelectItem value='me'>
                  Me ({user?.fullName || 'Current User'})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type='submit' disabled={loading}>
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

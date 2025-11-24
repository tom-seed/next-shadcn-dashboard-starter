'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Comments } from './comments';
import { IconArrowLeft, IconCheck, IconX } from '@tabler/icons-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigneeClerkUserId: string | null;
  createdAt: string;
  updatedAt: string;
  urlId?: number | null;
  url?: { url: string } | null;
  auditIssue?: { issueKey: string } | null;
}

interface TaskDetailViewProps {
  clientId: number;
  initialTask: Task;
}

export function TaskDetailView({ clientId, initialTask }: TaskDetailViewProps) {
  const router = useRouter();
  const [task, setTask] = useState(initialTask);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Edit state
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');

  const handleUpdate = async (updates: Partial<Task>) => {
    try {
      const res = await fetch(`/api/clients/${clientId}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!res.ok) throw new Error('Failed to update task');

      const updatedTask = await res.json();
      setTask(updatedTask);
      toast.success('Task updated');
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update task');
    }
  };

  const saveTextChanges = async () => {
    setLoading(true);
    try {
      await handleUpdate({ title, description });
      setIsEditing(false);
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setTitle(task.title);
    setDescription(task.description || '');
    setIsEditing(false);
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-4'>
        <Link href={`/dashboard/${clientId}/tasks`}>
          <Button variant='ghost' size='icon'>
            <IconArrowLeft className='h-4 w-4' />
          </Button>
        </Link>
        <div className='flex-1'>
          <div className='text-muted-foreground mb-1 flex items-center gap-2 text-sm'>
            <span>Task #{task.id}</span>
            <span>•</span>
            <span>{format(new Date(task.createdAt), 'MMM d, yyyy')}</span>
          </div>
          {isEditing ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className='h-auto px-2 py-1 text-lg font-bold'
            />
          ) : (
            <h1 className='text-2xl font-bold'>{task.title}</h1>
          )}
        </div>
        <div className='flex items-center gap-2'>
          {isEditing ? (
            <>
              <Button
                size='sm'
                variant='ghost'
                onClick={cancelEdit}
                disabled={loading}
              >
                <IconX className='mr-2 h-4 w-4' /> Cancel
              </Button>
              <Button size='sm' onClick={saveTextChanges} disabled={loading}>
                <IconCheck className='mr-2 h-4 w-4' /> Save
              </Button>
            </>
          ) : (
            <Button
              size='sm'
              variant='outline'
              onClick={() => setIsEditing(true)}
            >
              Edit Details
            </Button>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        <div className='space-y-6 lg:col-span-2'>
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className='min-h-[150px]'
                />
              ) : (
                <div className='text-sm whitespace-pre-wrap'>
                  {task.description || (
                    <span className='text-muted-foreground italic'>
                      No description provided.
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <Comments clientId={clientId} taskId={task.id} />
            </CardContent>
          </Card>
        </div>

        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label>Status</Label>
                <Select
                  value={task.status}
                  onValueChange={(val) => handleUpdate({ status: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='OPEN'>Open</SelectItem>
                    <SelectItem value='IN_PROGRESS'>In Progress</SelectItem>
                    <SelectItem value='FIXED'>Fixed</SelectItem>
                    <SelectItem value='IGNORED'>Ignored</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label>Priority</Label>
                <Select
                  value={task.priority}
                  onValueChange={(val) => handleUpdate({ priority: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='LOW'>Low</SelectItem>
                    <SelectItem value='MEDIUM'>Medium</SelectItem>
                    <SelectItem value='HIGH'>High</SelectItem>
                    <SelectItem value='CRITICAL'>Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label>Assignee</Label>
                <Select
                  value={task.assigneeClerkUserId || 'unassigned'}
                  onValueChange={(val) =>
                    handleUpdate({
                      assigneeClerkUserId: val === 'unassigned' ? null : val
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Unassigned' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='unassigned'>Unassigned</SelectItem>
                    {/* In a real app, we'd list team members here. 
                        For now, we can only reliably show the current assignee if set, or allow unassigning.
                        Ideally we'd pass a list of members to this component.
                    */}
                    {task.assigneeClerkUserId && (
                      <SelectItem value={task.assigneeClerkUserId}>
                        Current Assignee
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {task.url && (
                <div className='space-y-1'>
                  <Label className='text-muted-foreground text-xs'>
                    Related URL
                  </Label>
                  <div className='truncate text-sm'>
                    <Link
                      href={`/dashboard/${clientId}/urls/${task.urlId}`}
                      className='text-primary hover:underline'
                    >
                      {task.url.url}
                    </Link>
                  </div>
                </div>
              )}

              {task.auditIssue && (
                <div className='space-y-1'>
                  <Label className='text-muted-foreground text-xs'>
                    Related Issue
                  </Label>
                  <div className='text-sm'>{task.auditIssue.issueKey}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

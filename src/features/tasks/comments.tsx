'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatarProfile } from '@/components/user-avatar-profile';
import { formatDistanceToNow } from 'date-fns';
import { IconSend } from '@tabler/icons-react';

interface Comment {
  id: number;
  content: string;
  authorClerkUserId: string;
  createdAt: string;
}

interface CommentsProps {
  clientId: number;
  taskId: number;
}

export function Comments({ clientId, taskId }: CommentsProps) {
  const { user } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchComments = async () => {
    try {
      const res = await fetch(
        `/api/clients/${clientId}/tasks/${taskId}/comments`
      );
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchComments();
    // Poll for new comments every 10 seconds
    const interval = setInterval(fetchComments, 10000);
    return () => clearInterval(interval);
  }, [clientId, taskId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/clients/${clientId}/tasks/${taskId}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ content: newComment })
        }
      );

      if (!res.ok) {
        throw new Error('Failed to add comment');
      }

      const comment = await res.json();
      setComments([...comments, comment]);
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      console.error(error);
      toast.error('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex h-full flex-col space-y-4'>
      <h3 className='text-lg font-semibold'>Comments</h3>

      <div className='bg-muted/10 max-h-[500px] min-h-[200px] flex-1 space-y-4 overflow-y-auto rounded-md border p-4'>
        {fetching && comments.length === 0 ? (
          <div className='text-muted-foreground py-8 text-center'>
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className='text-muted-foreground py-8 text-center'>
            No comments yet.
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className='flex items-start gap-3'>
              {/* We don't have the user object for other users easily available here without fetching. 
                  For now, we'll show a generic avatar or just the ID if we can't resolve it. 
                  Ideally, we'd fetch user details or have them included in the API response if we stored them.
                  Since we only store clerkUserId, we can only show the current user's avatar correctly if it matches.
              */}
              <div className='bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold'>
                {comment.authorClerkUserId === user?.id ? 'Me' : '?'}
              </div>
              <div className='flex-1 space-y-1'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>
                    {comment.authorClerkUserId === user?.id
                      ? 'You'
                      : 'Team Member'}
                  </span>
                  <span className='text-muted-foreground text-xs'>
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true
                    })}
                  </span>
                </div>
                <div className='bg-background rounded-md border p-3 text-sm shadow-sm'>
                  {comment.content}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className='flex gap-2'>
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder='Write a comment...'
          className='min-h-[80px]'
        />
        <Button
          type='submit'
          disabled={loading || !newComment.trim()}
          size='icon'
          className='h-[80px] w-[80px]'
        >
          <IconSend className='h-5 w-5' />
        </Button>
      </form>
    </div>
  );
}

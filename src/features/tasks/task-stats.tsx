'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconAlertTriangle, IconCheck, IconList } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface StatsData {
  totalOpen: number;
  criticalOpen: number;
  fixedThisWeek: number;
}

export function TaskStats({
  tasks,
  totalItems
}: {
  tasks: any[];
  totalItems: number;
}) {
  const params = useParams();
  const clientId = params.clientId as string;
  const [stats, setStats] = useState<StatsData | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/clients/${clientId}/tasks/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats', error);
      }
    };
    fetchStats();
  }, [clientId, tasks]); // Refresh when tasks change (e.g. after update)

  if (!stats) return null;

  return (
    <div className='grid gap-4 md:grid-cols-3'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Open Tasks</CardTitle>
          <IconList className='text-muted-foreground h-4 w-4' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{stats.totalOpen}</div>
          <p className='text-muted-foreground text-xs'>
            Active issues needing attention
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Critical Issues</CardTitle>
          <IconAlertTriangle className='h-4 w-4 text-red-500' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{stats.criticalOpen}</div>
          <p className='text-muted-foreground text-xs'>High priority items</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Fixed This Week</CardTitle>
          <IconCheck className='h-4 w-4 text-green-500' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{stats.fixedThisWeek}</div>
          <p className='text-muted-foreground text-xs'>Progress since Monday</p>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartConfig
} from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconTrendingDown,
  IconTrendingUp
} from '@tabler/icons-react';

interface TrendPoint {
  date: string;
  pagesCrawled: number;
  totalIssues: number;
}

const chartConfig = {
  pagesCrawled: {
    label: 'Pages crawled',
    color: 'var(--chart-1)',
    icon: IconTrendingUp
  },
  totalIssues: {
    label: 'Total issues',
    color: 'var(--chart-2)',
    icon: IconAlertTriangle
  }
} satisfies ChartConfig;

export function AuditProgressChart() {
  const { clientId } = useParams();
  const [data, setData] = useState<TrendPoint[]>([]);

  useEffect(() => {
    if (!clientId) return;

    async function loadData() {
      try {
        const res = await fetch(
          `/api/clients/${clientId}/graphs/status-code-trends`
        );
        if (!res.ok) return;
        const { data } = await res.json();
        setData(
          (data as TrendPoint[]).map((point) => ({
            ...point,
            pagesCrawled: Number(point.pagesCrawled ?? 0),
            totalIssues: Number(point.totalIssues ?? 0)
          }))
        );
      } catch (error) {
        // ignore; chart will remain empty
      }
    }

    void loadData();
  }, [clientId]);

  const latestPoint = data.at(-1);
  const previousPoint = data.length > 1 ? data[data.length - 2] : undefined;
  const pagesDelta =
    latestPoint && previousPoint
      ? latestPoint.pagesCrawled - previousPoint.pagesCrawled
      : 0;
  const issuesDelta =
    latestPoint && previousPoint
      ? latestPoint.totalIssues - previousPoint.totalIssues
      : 0;
  const pagesTrendingUp = pagesDelta >= 0;
  const issuesTrendingUp = issuesDelta >= 0;

  const formatDelta = (value: number) =>
    value > 0 ? `+${value}` : value < 0 ? value.toString() : '0';

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle>Progress over time</CardTitle>
        <CardDescription>
          Audits plotted by pages crawled vs. total issues discovered
        </CardDescription>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer config={chartConfig} className='h-[220px] w-full'>
          <AreaChart data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='date'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value: string) => value.slice(5)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator='line' />}
            />
            <Area
              dataKey='pagesCrawled'
              type='natural'
              fill='var(--color-pagesCrawled)'
              fillOpacity={0.45}
              stroke='var(--color-pagesCrawled)'
              strokeWidth={2}
              stackId='a'
            />
            <Area
              dataKey='totalIssues'
              type='natural'
              fill='var(--color-totalIssues)'
              fillOpacity={0.45}
              stroke='var(--color-totalIssues)'
              strokeWidth={2}
              stackId='a'
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className='flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm'>
        <div className='text-muted-foreground flex items-center gap-2 font-medium'>
          <span className='flex items-center gap-1'>
            {pagesTrendingUp ? (
              <IconTrendingUp className='h-4 w-4 text-emerald-500' />
            ) : (
              <IconTrendingDown className='h-4 w-4 text-red-500' />
            )}
            {pagesTrendingUp ? 'Pages up' : 'Pages down'}{' '}
            {formatDelta(pagesDelta)} vs. previous audit
          </span>
        </div>
        <div className='text-muted-foreground flex items-center gap-2'>
          <span className='flex items-center gap-1'>
            {issuesTrendingUp ? (
              <IconAlertTriangle className='h-4 w-4 text-red-500' />
            ) : (
              <IconCircleCheck className='h-4 w-4 text-emerald-500' />
            )}
            {issuesTrendingUp ? 'Issues up' : 'Issues down'}{' '}
            {formatDelta(issuesDelta)}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}

'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface TrendPoint {
  date: string;
  pagesCrawled: number;
  totalIssues: number;
}

const chartConfig = {
  pagesCrawled: {
    label: 'Pages Crawled',
    color: 'var(--chart-1)'
  },
  totalIssues: {
    label: 'Total Issues',
    color: 'var(--chart-2)'
  }
} satisfies ChartConfig;

export function AuditProgressChart() {
  const { clientId } = useParams();
  const [data, setData] = React.useState<TrendPoint[]>([]);
  const [timeRange, setTimeRange] = React.useState('90d');

  React.useEffect(() => {
    if (!clientId) return;

    async function loadData() {
      try {
        const res = await fetch(
          `/api/clients/${clientId}/graphs/status-code-trends`
        );
        if (!res.ok) return;
        const { data } = await res.json();
        const sortedData = (data as TrendPoint[])
          .map((point) => ({
            ...point,
            pagesCrawled: Number(point.pagesCrawled ?? 0),
            totalIssues: Number(point.totalIssues ?? 0)
          }))
          .sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );
        setData(sortedData);
      } catch {
        // ignore
      }
    }

    void loadData();
  }, [clientId]);

  const filteredData = React.useMemo(() => {
    if (data.length === 0) return [];

    const referenceDate = new Date();
    let daysToSubtract = 90;
    if (timeRange === '30d') {
      daysToSubtract = 30;
    } else if (timeRange === '7d') {
      daysToSubtract = 7;
    }

    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);

    const inRange = data.filter((item) => new Date(item.date) >= startDate);
    return inRange.length > 2 ? inRange : data;
  }, [data, timeRange]);

  return (
    <Card className='@container/card w-full'>
      <CardHeader className='flex items-center gap-2 space-y-0 py-5 sm:flex-row'>
        <div className='grid flex-1 gap-1'>
          <CardTitle>Audit History</CardTitle>
          <CardDescription>
            Crawled pages vs total issues over time
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className='w-[160px] rounded-lg sm:ml-auto'
            aria-label='Select a value'
          >
            <SelectValue placeholder='Last 3 months' />
          </SelectTrigger>
          <SelectContent className='rounded-xl'>
            <SelectItem value='90d' className='rounded-lg'>
              Last 3 months
            </SelectItem>
            <SelectItem value='30d' className='rounded-lg'>
              Last 30 days
            </SelectItem>
            <SelectItem value='7d' className='rounded-lg'>
              Last 7 days
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[250px] w-full'
        >
          <AreaChart data={filteredData} margin={{ left: 12, right: 12 }}>
            <defs>
              <linearGradient id='fillPages' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor={chartConfig.pagesCrawled.color}
                  stopOpacity={0.8}
                />
                <stop
                  offset='95%'
                  stopColor={chartConfig.pagesCrawled.color}
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id='fillIssues' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor={chartConfig.totalIssues.color}
                  stopOpacity={0.8}
                />
                <stop
                  offset='95%'
                  stopColor={chartConfig.totalIssues.color}
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='date'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                });
              }}
            />
            <YAxis
              yAxisId='left'
              orientation='left'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={48}
              tickFormatter={(value: number) =>
                value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value)
              }
            />
            <YAxis
              yAxisId='right'
              orientation='right'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={48}
              tickFormatter={(value: number) =>
                value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value)
              }
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator='dot' />}
            />
            <Area
              yAxisId='right'
              dataKey='totalIssues'
              type='natural'
              fill='url(#fillIssues)'
              stroke={chartConfig.totalIssues.color}
            />
            <Area
              yAxisId='left'
              dataKey='pagesCrawled'
              type='natural'
              fill='url(#fillPages)'
              stroke={chartConfig.pagesCrawled.color}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

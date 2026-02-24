// FILE: src/features/overview/components/area-graph-status-codes.tsx
'use client';

import { useEffect, useState } from 'react';
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
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { useParams } from 'next/navigation';

const chartKeys = ['2xx', '3xx', '4xx', '5xx'] as const;
type ChartKey = (typeof chartKeys)[number];

const chartConfig: Record<ChartKey, { label: string; color: string }> = {
  '2xx': { label: '2xx Success', color: 'var(--chart-1)' },
  '3xx': { label: '3xx Redirects', color: 'var(--chart-2)' },
  '4xx': { label: '4xx Client Errors', color: 'var(--chart-3)' },
  '5xx': { label: '5xx Server Errors', color: 'var(--chart-4)' }
};

export function AreaGraphStatusCodes() {
  const { clientId } = useParams();
  const [chartData, setChartData] = useState<
    Array<Record<ChartKey | 'date', string | number>>
  >([]);
  const [timeRange, setTimeRange] = useState('90d');

  useEffect(() => {
    if (!clientId) return;

    async function fetchChartData() {
      try {
        const res = await fetch(
          `/api/clients/${clientId}/graphs/status-code-trends`
        );
        const { data } = await res.json();
        setChartData(data);
      } catch {
        // ignore
      }
    }

    fetchChartData();
  }, [clientId]);

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date as string);
    const referenceDate = new Date();
    let daysToSubtract = 90;
    if (timeRange === '30d') {
      daysToSubtract = 30;
    } else if (timeRange === '7d') {
      daysToSubtract = 7;
    }
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  return (
    <Card className='@container/card h-full'>
      <CardHeader className='flex items-center gap-2 space-y-0 py-5 sm:flex-row'>
        <div className='grid flex-1 gap-1'>
          <CardTitle>Status Codes</CardTitle>
          <CardDescription>
            Distribution of response codes over time
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
          config={chartConfig as ChartConfig}
          className='aspect-auto h-[250px] w-full'
        >
          <AreaChart data={filteredData} margin={{ left: 12, right: 12 }}>
            <defs>
              {chartKeys.map((key) => (
                <linearGradient
                  key={key}
                  id={`fill-${key}`}
                  x1='0'
                  y1='0'
                  x2='0'
                  y2='1'
                >
                  <stop
                    offset='5%'
                    stopColor={chartConfig[key].color}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset='95%'
                    stopColor={chartConfig[key].color}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              ))}
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
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator='dot' />}
            />
            {chartKeys.map((key) => (
              <Area
                key={key}
                dataKey={key}
                type='natural'
                fill={`url(#fill-${key})`}
                stroke={chartConfig[key].color}
                stackId='a'
              />
            ))}
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

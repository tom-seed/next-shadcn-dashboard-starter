// FILE: src/features/overview/components/area-graph-status-codes.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { IconTrendingUp } from '@tabler/icons-react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { useParams } from 'next/navigation';

const chartKeys = ['2xx', '3xx', '4xx', '5xx'] as const;
type ChartKey = (typeof chartKeys)[number];

const chartConfig: Record<ChartKey, { label: string; color: string }> = {
  '2xx': { label: '2xx Success', color: 'var(--color-2xx)' },
  '3xx': { label: '3xx Redirects', color: 'var(--color-3xx)' },
  '4xx': { label: '4xx Client Errors', color: 'var(--color-4xx)' },
  '5xx': { label: '5xx Server Errors', color: 'var(--color-5xx)' }
};

export function AreaGraphStatusCodes() {
  const { clientId } = useParams();
  const [chartData, setChartData] = useState<
    Array<Record<ChartKey | 'date', string | number>>
  >([]);

  useEffect(() => {
    if (!clientId) return;

    async function fetchChartData() {
      try {
        const res = await fetch(
          `/api/client/${clientId}/graphs/status-code-trends`
        );
        const { data } = await res.json();
        setChartData(data);
      } catch {
        // ignore
      }
    }

    fetchChartData();
  }, [clientId]);

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle>Status Codes Over Time</CardTitle>
        <CardDescription>
          Visual breakdown of status code trends
        </CardDescription>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig as ChartConfig}
          className='aspect-auto h-[250px] w-full'
        >
          <AreaChart data={chartData} margin={{ left: 12, right: 12 }}>
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
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className='flex w-full items-start gap-2 text-sm'>
          <div className='grid gap-2'>
            <div className='flex items-center gap-2 leading-none font-medium'>
              Trending up this month <IconTrendingUp className='h-4 w-4' />
            </div>
            <div className='text-muted-foreground'>Based on audit history</div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

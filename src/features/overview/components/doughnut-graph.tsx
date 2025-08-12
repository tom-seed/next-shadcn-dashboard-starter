'use client';

import * as React from 'react';
import { IconTrendingUp } from '@tabler/icons-react';
import { Cell, Pie, PieChart } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';

interface DoughnutGraphProps {
  auditScore: number;
}

const chartConfig = {
  score: {
    label: 'Audit Score',
    color: 'var(--primary)'
  }
} satisfies ChartConfig;

export function DoughnutGraph({ auditScore }: DoughnutGraphProps) {
  const chartData = [
    { name: 'Score', value: auditScore, fill: 'var(--primary)' },
    {
      name: 'Remaining',
      value: 100 - auditScore,
      fill: 'var(--background-muted)'
    }
  ];

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle>Audit Score</CardTitle>
        <CardDescription>Overall audit performance</CardDescription>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[246px] w-full'
        >
          <PieChart>
            <Pie
              data={chartData}
              cx='50%'
              cy='50%'
              innerRadius={60}
              outerRadius={100}
              paddingAngle={6}
              dataKey='value'
            >
              <Cell fill={chartData[0].fill} />
              <Cell fill={chartData[1].fill} />
            </Pie>
            <text
              x='50%'
              y='50%'
              textAnchor='middle'
              dominantBaseline='central'
              className='text-4xl font-bold'
            >
              {`${auditScore}%`}
            </text>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className='flex w-full items-start gap-2 text-sm'>
          <div className='grid gap-2'>
            <div className='flex items-center gap-2 leading-none font-medium'>
              <span className='text-muted-foreground text-sm'>
                {auditScore >= 80
                  ? 'Excellent'
                  : auditScore >= 60
                    ? 'Good'
                    : 'Needs Improvement'}
              </span>
              <IconTrendingUp
                className={`h-4 w-4 ${auditScore >= 80 ? 'text-green-500' : auditScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`}
              />
            </div>
            <div className='text-muted-foreground'>Based on audit score</div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

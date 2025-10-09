'use client';

import * as React from 'react';
import { IconTrendingUp } from '@tabler/icons-react';
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart
} from 'recharts';

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
    {
      name: 'score',
      value: auditScore,
      fill: 'var(--primary)'
    }
  ];

  // Calculate end angle based on score (0-100 maps to 0-360)
  const endAngle = (auditScore / 100) * 360;

  return (
    <Card className='@container/card flex flex-col'>
      <CardHeader className='items-center pb-0'>
        <CardTitle>Audit Score</CardTitle>
        <CardDescription className='flex flex-row'>
          <span className='text-muted-foreground text-sm'>
            {auditScore >= 80
              ? 'Excellent performance'
              : auditScore >= 60
                ? 'Good performance'
                : 'Needs Improvement'}
          </span>
          <IconTrendingUp
            className={`h-4 w-4 ${auditScore >= 80 ? 'text-green-500' : auditScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`}
          />
        </CardDescription>
      </CardHeader>
      <CardContent className='flex-1 pb-0'>
        <ChartContainer
          config={chartConfig}
          className='mx-auto aspect-square max-h-[250px]'
        >
          <RadialBarChart
            data={chartData}
            startAngle={0}
            endAngle={endAngle}
            innerRadius={80}
            outerRadius={110}
          >
            <PolarGrid
              gridType='circle'
              radialLines={false}
              stroke='none'
              className='first:fill-muted last:fill-background'
              polarRadius={[86, 74]}
            />
            <RadialBar dataKey='value' background cornerRadius={10} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor='middle'
                        dominantBaseline='middle'
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className='fill-foreground text-4xl font-bold'
                        >
                          {auditScore}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className='fill-muted-foreground'
                        >
                          Score
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className='flex-col gap-2 text-sm'>
        <div className='items-right flex gap-2 leading-none font-medium'>
          <span>Fix your trending issues to increase audit score</span>
        </div>
      </CardFooter>
    </Card>
  );
}

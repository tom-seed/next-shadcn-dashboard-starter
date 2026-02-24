'use client';

import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ClusterChartProps {
  data: {
    id: number;
    label: string | null;
    density: number | null;
    memberCount: number;
  }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function ClusterChart({ data }: ClusterChartProps) {
  const chartData = data.map((item) => ({
    x: item.density || 0,
    y: item.memberCount,
    z: item.memberCount,
    name: item.label || `Cluster ${item.id}`,
    original: item
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className='bg-background rounded-lg border p-2 shadow-sm'>
          <div className='grid grid-cols-2 gap-2'>
            <div className='flex flex-col'>
              <span className='text-muted-foreground text-[0.70rem] uppercase'>
                Topic
              </span>
              <span className='text-muted-foreground font-bold'>
                {dataPoint.name}
              </span>
            </div>
            <div className='flex flex-col'>
              <span className='text-muted-foreground text-[0.70rem] uppercase'>
                Density
              </span>
              <span className='font-bold'>{dataPoint.x.toFixed(3)}</span>
            </div>
            <div className='flex flex-col'>
              <span className='text-muted-foreground text-[0.70rem] uppercase'>
                Pages
              </span>
              <span className='font-bold'>{dataPoint.y}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className='col-span-4'>
      <CardHeader>
        <CardTitle>Topic Density vs Size</CardTitle>
      </CardHeader>
      <CardContent className='pl-2'>
        <div className='h-[400px] w-full'>
          <ResponsiveContainer width='100%' height='100%'>
            <ScatterChart
              margin={{
                top: 20,
                right: 20,
                bottom: 20,
                left: 20
              }}
            >
              <XAxis
                type='number'
                dataKey='x'
                name='Density'
                unit=''
                domain={[0, 1]}
                tickLine={false}
                axisLine={false}
                label={{
                  value: 'Density Score',
                  position: 'insideBottomRight',
                  offset: -10
                }}
              />
              <YAxis
                type='number'
                dataKey='y'
                name='Pages'
                unit=''
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                label={{
                  value: 'Page Count',
                  angle: -90,
                  position: 'insideLeft'
                }}
              />
              <ZAxis type='number' dataKey='z' range={[60, 400]} name='Pages' />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ strokeDasharray: '3 3' }}
              />
              <Scatter name='Clusters' data={chartData} fill='#8884d8'>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

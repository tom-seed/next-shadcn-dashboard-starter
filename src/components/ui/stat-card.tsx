import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DeltaBadge } from '@/components/ui/delta-badge';

interface StatCardProps {
  label: string;
  count: number;
  prevCount?: number | null;
  pct?: number;
  color?: string;
  barColor?: string;
  invertDelta?: boolean;
}

export function StatCard({
  label,
  count,
  prevCount,
  pct,
  color = '',
  barColor = '',
  invertDelta
}: StatCardProps) {
  return (
    <Card>
      <CardContent className='flex flex-col gap-2 py-4'>
        <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
          {label}
        </p>
        <div className='flex items-baseline gap-2'>
          <span className={`text-2xl font-bold tabular-nums ${color}`}>
            {count.toLocaleString()}
          </span>
          {pct !== undefined && (
            <span className='text-muted-foreground text-xs'>{pct}%</span>
          )}
          <DeltaBadge
            current={count}
            previous={prevCount ?? null}
            invertColor={invertDelta}
          />
        </div>
        {pct !== undefined && (
          <Progress
            value={Math.min(pct, 100)}
            className={`h-1.5 ${barColor}`}
          />
        )}
      </CardContent>
    </Card>
  );
}

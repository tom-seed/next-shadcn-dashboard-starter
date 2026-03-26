import { Badge } from '@/components/ui/badge';
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';

interface DeltaBadgeProps {
  current: number;
  previous: number | null;
  /** When true, an increase is shown as green (good). Default: increase is red (bad). */
  invertColor?: boolean;
}

export function DeltaBadge({
  current,
  previous,
  invertColor
}: DeltaBadgeProps) {
  if (previous === null) return null;
  const diff = current - previous;
  if (diff === 0) return null;
  const isUp = diff > 0;
  const isGood = invertColor ? isUp : !isUp;
  return (
    <Badge
      variant='outline'
      className={isGood ? 'text-green-600' : 'text-red-600'}
    >
      {isUp ? (
        <IconTrendingUp className='mr-1 h-3 w-3' />
      ) : (
        <IconTrendingDown className='mr-1 h-3 w-3' />
      )}
      {isUp ? `+${diff}` : diff}
    </Badge>
  );
}

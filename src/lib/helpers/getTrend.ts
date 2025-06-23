export function getTrend(current: number, previous: number) {
  if (!previous || previous === 0) return { delta: 0, direction: 'neutral' };

  const delta = (((current - previous) / previous) * 100).toFixed(1);
  const diff = parseFloat(delta);

  return {
    delta: diff,
    direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral'
  };
}

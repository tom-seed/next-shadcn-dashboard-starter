// File: src/lib/audits/headings.ts
import { countIf, isMissing, isMultiple, isDuplicate } from './base';

export function auditHeading(
  tag: string,
  values: string[],
  stats: Record<string, number>
) {
  const key = tag.toLowerCase();
  stats[`pages_missing_${key}`] = countIf(
    isMissing(values),
    stats[`pages_missing_${key}`] || 0
  );
  stats[`pages_with_multiple_${key}s`] = countIf(
    isMultiple(values),
    stats[`pages_with_multiple_${key}s`] || 0
  );
  stats[`pages_with_duplicate_${key}s`] = countIf(
    isDuplicate(values),
    stats[`pages_with_duplicate_${key}s`] || 0
  );
  return stats;
}

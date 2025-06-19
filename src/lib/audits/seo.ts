// File: src/lib/audits/seo.ts
import { countIf, isMissing } from './base';

export function auditTitle(title: string, stats: Record<string, number>) {
  stats['pages_missing_title'] = countIf(
    isMissing(title),
    stats['pages_missing_title'] || 0
  );
  stats['too_short_title'] = countIf(
    title.length < 35,
    stats['too_short_title'] || 0
  );
  stats['too_long_title'] = countIf(
    title.length > 65,
    stats['too_long_title'] || 0
  );
  return stats;
}

export function auditDescription(
  description: string,
  stats: Record<string, number>
) {
  stats['pages_missing_description'] = countIf(
    isMissing(description),
    stats['pages_missing_description'] || 0
  );
  stats['too_short_description'] = countIf(
    description.length < 70,
    stats['too_short_description'] || 0
  );
  stats['too_long_description'] = countIf(
    description.length > 160,
    stats['too_long_description'] || 0
  );
  return stats;
}

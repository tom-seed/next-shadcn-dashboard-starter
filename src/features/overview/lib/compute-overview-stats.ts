type OverviewSeverity = 'Alert' | 'Warning' | 'Opportunity';

const EXCLUDE_KEYS = new Set([
  'id',
  'clientId',
  'crawlId',
  'createdAt',
  'updatedAt',
  'score',
  'pages_200_response',
  'pages_3xx_response',
  'pages_4xx_response',
  'pages_5xx_response',
  'pages_301_permanent',
  'pages_302_temporary',
  'pages_303_see_other',
  'pages_307_temporary',
  'pages_308_permanent',
  'pages_3xx_other',
  'pages_401_unauthorized',
  'pages_403_forbidden',
  'pages_404_not_found',
  'pages_405_method_not_allowed',
  'pages_408_timeout',
  'pages_410_gone',
  'pages_429_rate_limited',
  'pages_4xx_other',
  'pages_500_internal_error',
  'pages_502_bad_gateway',
  'pages_503_unavailable',
  'pages_504_timeout',
  'pages_5xx_other',
  'total_images',
  'pages_with_images_missing_alt',
  'pages_with_images_empty_alt',
  'pages_with_images_missing_dimensions',
  'pages_with_unoptimized_image_format',
  'total_images_missing_alt',
  'total_images_empty_alt',
  'total_images_missing_dimensions',
  'total_images_unoptimized_format'
]);

function getSeverity(k: string): OverviewSeverity {
  if (/5xx|4xx|missing_(title|description|h1|h2)/.test(k)) return 'Alert';
  if (
    /3xx|multiple_(title|description|h1)|with_multiple_h2s|duplicate_(title|description|h1|h2)/.test(
      k
    )
  )
    return 'Warning';
  if (/too_short_|too_long_|under_|over_/.test(k)) return 'Opportunity';
  return 'Warning';
}

export function prettyIssue(k: string): string {
  return k
    .replace(/^pages_/, '')
    .replace(/_/g, ' ')
    .replace(/\bwith\b\s*/i, '')
    .replace(/\bh1\b/gi, 'H1')
    .replace(/\bh2\b/gi, 'H2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface IssueDelta {
  key: string;
  latest: number;
  prev: number;
  delta: number;
  severity: OverviewSeverity;
}

export function computeIssueDeltas(
  latestObj: Record<string, unknown>,
  prevObj: Record<string, unknown>
): IssueDelta[] {
  if (!latestObj) return [];
  const entries: IssueDelta[] = [];
  for (const [k, v] of Object.entries(latestObj)) {
    if (EXCLUDE_KEYS.has(k)) continue;
    if (typeof v !== 'number') continue;
    const prev = typeof prevObj?.[k] === 'number' ? (prevObj[k] as number) : 0;
    entries.push({
      key: k,
      latest: v,
      prev,
      delta: v - prev,
      severity: getSeverity(k)
    });
  }
  return entries;
}

export interface OverviewStats {
  issueDeltas: IssueDelta[];
  topTrendingUp: IssueDelta[];
  topTrendingDown: IssueDelta[];
  severityTotals: Record<OverviewSeverity, number>;
  resolvedIssuesCount: number;
  newIssuesCount: number;
  netChange: number;
  totalPages: number;
  schemaPct: number;
  schemaTotal: number;
  recommendations: { title: string; description: string }[];
}

export function computeOverviewStats(
  displayAudit: Record<string, unknown>,
  comparisonAudit: Record<string, unknown> | null
): OverviewStats {
  const issueDeltas = computeIssueDeltas(displayAudit, comparisonAudit ?? {});

  const TOP_LIMIT = 5;
  const topTrendingUp = issueDeltas
    .filter((e) => e.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, TOP_LIMIT);
  const topTrendingDown = issueDeltas
    .filter((e) => e.delta < 0)
    .sort((a, b) => a.delta - b.delta)
    .slice(0, TOP_LIMIT);

  const severityTotals: Record<OverviewSeverity, number> = {
    Alert: 0,
    Warning: 0,
    Opportunity: 0
  };
  for (const entry of issueDeltas) {
    severityTotals[entry.severity] += entry.latest ?? 0;
  }

  const resolvedIssuesCount = issueDeltas
    .filter((e) => e.delta < 0)
    .reduce((acc, e) => acc + Math.abs(e.delta), 0);
  const newIssuesCount = issueDeltas
    .filter((e) => e.delta > 0)
    .reduce((acc, e) => acc + e.delta, 0);

  const num = (k: string) => (displayAudit[k] as number) ?? 0;

  const totalPages =
    num('pages_200_response') +
    num('pages_3xx_response') +
    num('pages_4xx_response') +
    num('pages_5xx_response');

  const schemaTotal = num('pages_with_schema') + num('pages_missing_schema');
  const schemaPct =
    schemaTotal > 0
      ? Math.round((num('pages_with_schema') / schemaTotal) * 100)
      : 0;

  const recommendations: { title: string; description: string }[] = [];

  if (severityTotals.Alert > 0) {
    recommendations.push({
      title: `Fix ${severityTotals.Alert} critical issues affecting your site's search visibility`,
      description:
        'These issues directly affect how search engines see your site.'
    });
  }
  if (num('total_images_missing_alt') > 0) {
    recommendations.push({
      title: `Add alt text to ${num('total_images_missing_alt')} images to improve accessibility and SEO`,
      description:
        'Alt text helps visually impaired users and gives search engines context about your images.'
    });
  }
  if (num('pages_not_in_sitemap') > 0) {
    recommendations.push({
      title: `Submit ${num('pages_not_in_sitemap')} pages to your XML sitemap so search engines can find them`,
      description:
        'Pages missing from your sitemap may not be discovered or indexed promptly.'
    });
  }
  if (num('total_orphaned_pages') > 0) {
    recommendations.push({
      title: `Add internal links to ${num('total_orphaned_pages')} orphaned pages so visitors and search engines can reach them`,
      description:
        'Orphaned pages have no internal links pointing to them, making them hard to find.'
    });
  }
  if (num('pages_thin_content') > 0) {
    recommendations.push({
      title: `Expand content on ${num('pages_thin_content')} thin pages to provide more value to visitors`,
      description:
        'Thin pages may not rank well and offer little value to your audience.'
    });
  }
  if (num('pages_exact_duplicate_content') > 0) {
    recommendations.push({
      title: `Consolidate ${num('pages_exact_duplicate_content')} duplicate pages to avoid confusing search engines`,
      description:
        'Duplicate content splits ranking signals and can lead to the wrong page appearing in search results.'
    });
  }
  if (num('pages_slow_response') > 0) {
    recommendations.push({
      title: `Improve load times on ${num('pages_slow_response')} slow pages to reduce visitor drop-off`,
      description:
        'Slow pages frustrate visitors and can hurt your search rankings.'
    });
  }

  return {
    issueDeltas,
    topTrendingUp,
    topTrendingDown,
    severityTotals,
    resolvedIssuesCount,
    newIssuesCount,
    netChange: resolvedIssuesCount - newIssuesCount,
    totalPages,
    schemaPct,
    schemaTotal,
    recommendations: recommendations.slice(0, 4)
  };
}

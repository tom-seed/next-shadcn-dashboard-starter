// File: src/lib/audits/responses.ts

export function auditStatusCode(
  statusCode: number,
  stats: Record<string, number>
) {
  if (statusCode >= 200 && statusCode < 300) {
    stats['pages_200_response'] = (stats['pages_200_response'] || 0) + 1;
  } else if (statusCode >= 300 && statusCode < 400) {
    stats['pages_3xx_response'] = (stats['pages_3xx_response'] || 0) + 1;
  } else if (statusCode >= 400 && statusCode < 500) {
    stats['pages_4xx_response'] = (stats['pages_4xx_response'] || 0) + 1;
  } else if (statusCode >= 500 && statusCode < 600) {
    stats['pages_5xx_response'] = (stats['pages_5xx_response'] || 0) + 1;
  }

  return stats;
}

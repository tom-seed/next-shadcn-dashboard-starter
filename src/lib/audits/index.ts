// File: src/lib/audits/index.ts
import { auditTitle, auditDescription } from './seo';
import { auditHeading } from './headings';
import { auditStatusCode } from './responses';

interface AuditInput {
  title?: string;
  description?: string;
  headings?: Record<string, string[]>;
  statusCode?: number;
}

export function runAudits({
  title,
  description,
  headings,
  statusCode
}: AuditInput): Record<string, number> {
  const stats: Record<string, number> = {};

  if (title) {
    auditTitle(title, stats);
  }

  auditDescription(description || '', stats);

  if (headings) {
    for (const [tag, values] of Object.entries(headings)) {
      auditHeading(tag, values, stats);
    }
  }

  if (statusCode !== undefined) {
    auditStatusCode(statusCode, stats);
  }

  return stats;
}

import Link from 'next/link';
import type { Audit } from '@prisma/client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heading } from '@/components/ui/heading';
import { StatCard } from '@/components/ui/stat-card';
import { DeltaBadge } from '@/components/ui/delta-badge';
import { severityConfig } from '@/lib/severity';
import {
  SECTIONS,
  ISSUE_REGISTRY,
  getIssuesBySection,
  type Severity,
  type IssueDefinition
} from './lib/issue-registry';

type Props = {
  clientId: string;
  latest: Audit;
  previous: Audit | null;
  semantic: {
    cannibalisation: number;
    clusters: number;
    suggestions: number;
  } | null;
};

export default function AuditComparisonView({
  clientId,
  latest,
  previous,
  semantic
}: Props) {
  const val = (field: string) =>
    ((latest as Record<string, unknown>)[field] as number) ?? 0;
  const prevVal = (field: string) =>
    previous
      ? (((previous as Record<string, unknown>)[field] as number) ?? 0)
      : null;

  const totalPages =
    val('pages_200_response') +
    val('pages_3xx_response') +
    val('pages_4xx_response') +
    val('pages_5xx_response');

  const criticalIssues =
    val('pages_4xx_response') +
    val('pages_5xx_response') +
    val('pages_missing_title') +
    val('pages_missing_description') +
    val('pages_missing_h1');

  const warnings =
    val('pages_3xx_response') +
    val('pages_with_duplicate_h1s') +
    val('pages_with_multiple_h1s');

  const prevCritical = previous
    ? (prevVal('pages_4xx_response') ?? 0) +
      (prevVal('pages_5xx_response') ?? 0) +
      (prevVal('pages_missing_title') ?? 0) +
      (prevVal('pages_missing_description') ?? 0) +
      (prevVal('pages_missing_h1') ?? 0)
    : null;

  const prevWarnings = previous
    ? (prevVal('pages_3xx_response') ?? 0) +
      (prevVal('pages_with_duplicate_h1s') ?? 0) +
      (prevVal('pages_with_multiple_h1s') ?? 0)
    : null;

  const prevTotalPages = previous
    ? (prevVal('pages_200_response') ?? 0) +
      (prevVal('pages_3xx_response') ?? 0) +
      (prevVal('pages_4xx_response') ?? 0) +
      (prevVal('pages_5xx_response') ?? 0)
    : null;

  return (
    <div className='flex flex-1 flex-col gap-8'>
      <div className='flex items-start justify-between'>
        <Heading
          title='Audit Comparison'
          description='Compare the latest audit with the previous one'
        />
      </div>

      {/* Summary Stats */}
      <div className='grid gap-4 md:grid-cols-4'>
        <StatCard
          label='Health Score'
          count={latest?.score ?? 0}
          prevCount={previous?.score ?? null}
          pct={latest?.score ?? 0}
          color={severityConfig.opportunity.text}
          barColor='[&_[data-slot=progress-indicator]]:bg-emerald-500'
          invertDelta
        />
        <StatCard
          label='Total Pages'
          count={totalPages}
          prevCount={prevTotalPages}
          color='text-slate-600 dark:text-slate-400'
          barColor={severityConfig.info.bar}
          invertDelta
        />
        <StatCard
          label='Critical Issues'
          count={criticalIssues}
          prevCount={prevCritical}
          pct={
            totalPages > 0 ? Math.round((criticalIssues / totalPages) * 100) : 0
          }
          color={severityConfig.critical.text}
          barColor={severityConfig.critical.bar}
        />
        <StatCard
          label='Warnings'
          count={warnings}
          prevCount={prevWarnings}
          pct={totalPages > 0 ? Math.round((warnings / totalPages) * 100) : 0}
          color={severityConfig.warning.text}
          barColor={severityConfig.warning.bar}
        />
      </div>

      {/* Issue Sections */}
      {SECTIONS.map((section) => {
        const issues = getIssuesBySection(section.key);
        const visibleIssues = issues.filter((issue) => {
          const count = val(issue.field);
          if (count > 0) return true;
          return issue.severity === 'critical' || issue.severity === 'warning';
        });

        if (visibleIssues.length === 0) return null;

        return (
          <div key={section.key} className='space-y-3'>
            <Heading
              size='section'
              title={section.title}
              description={section.description}
            />

            <Card>
              <CardContent className='pt-4'>
                <div className='space-y-0.5'>
                  {visibleIssues.map((issue) => (
                    <IssueRow
                      key={issue.field}
                      issue={issue}
                      count={val(issue.field)}
                      prevCount={prevVal(issue.field)}
                      totalPages={totalPages}
                      clientId={clientId}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}

      {/* Semantic Insights */}
      {semantic &&
        (semantic.cannibalisation > 0 ||
          semantic.clusters > 0 ||
          semantic.suggestions > 0) && (
          <div className='space-y-3'>
            <Heading
              size='section'
              title='AI-Powered Insights'
              description='Patterns detected using content analysis and machine learning'
            />

            <div className='grid gap-4 md:grid-cols-3'>
              {semantic.cannibalisation > 0 && (
                <Link
                  href={`/dashboard/${clientId}/audits/issues/cannibalisation-group`}
                >
                  <Card className='hover:border-primary/50 transition-colors'>
                    <CardHeader className='pb-2'>
                      <CardTitle className='text-base'>
                        Keyword Cannibalisation
                      </CardTitle>
                      <CardDescription>
                        Pages competing for the same keywords in search results
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <span className='text-2xl font-bold text-amber-600 tabular-nums dark:text-amber-400'>
                        {semantic.cannibalisation}
                      </span>
                      <span className='text-muted-foreground ml-2 text-sm'>
                        groups
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              )}

              {semantic.clusters > 0 && (
                <Link href={`/dashboard/${clientId}/audits/clusters`}>
                  <Card className='hover:border-primary/50 transition-colors'>
                    <CardHeader className='pb-2'>
                      <CardTitle className='text-base'>
                        Topic Clusters
                      </CardTitle>
                      <CardDescription>
                        Groups of related pages that could strengthen each other
                        with internal links
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <span className='text-2xl font-bold text-sky-600 tabular-nums dark:text-sky-400'>
                        {semantic.clusters}
                      </span>
                      <span className='text-muted-foreground ml-2 text-sm'>
                        clusters
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              )}

              {semantic.suggestions > 0 && (
                <Link href={`/dashboard/${clientId}/audits/suggestions`}>
                  <Card className='hover:border-primary/50 transition-colors'>
                    <CardHeader className='pb-2'>
                      <CardTitle className='text-base'>
                        Link Suggestions
                      </CardTitle>
                      <CardDescription>
                        Opportunities to add internal links between related
                        pages
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <span className='text-2xl font-bold text-emerald-600 tabular-nums dark:text-emerald-400'>
                        {semantic.suggestions}
                      </span>
                      <span className='text-muted-foreground ml-2 text-sm'>
                        suggestions
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              )}
            </div>
          </div>
        )}
    </div>
  );
}

function IssueRow({
  issue,
  count,
  prevCount,
  totalPages,
  clientId
}: {
  issue: IssueDefinition;
  count: number;
  prevCount: number | null;
  totalPages: number;
  clientId: string;
}) {
  const cfg = severityConfig[issue.severity];
  const pct = totalPages > 0 ? Math.round((count / totalPages) * 100) : 0;

  return (
    <Link
      href={`/dashboard/${clientId}/audits/issues/${issue.field.replace(/_/g, '-')}`}
      className='hover:bg-muted/50 flex items-center justify-between gap-4 rounded-md px-3 py-2 text-sm transition-colors'
    >
      <div className='flex min-w-0 items-center gap-3'>
        <div className={`h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
        <div className='min-w-0'>
          <span className='font-medium'>{issue.label}</span>
          <p className='text-muted-foreground truncate text-xs'>
            {issue.description}
          </p>
        </div>
      </div>
      <div className='flex shrink-0 items-center gap-3'>
        <div className='flex items-center gap-2'>
          <span
            className={`font-bold tabular-nums ${count > 0 ? cfg.text : 'text-muted-foreground'}`}
          >
            {count.toLocaleString()}
          </span>
          {pct > 0 && (
            <span className='text-muted-foreground text-xs'>{pct}%</span>
          )}
        </div>
        <DeltaBadge current={count} previous={prevCount} />
      </div>
    </Link>
  );
}

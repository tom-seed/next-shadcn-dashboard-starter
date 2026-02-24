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
import { Progress } from '@/components/ui/progress';
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import { Heading } from '@/components/ui/heading';
import {
  SECTIONS,
  ISSUE_REGISTRY,
  getIssuesBySection,
  type Severity,
  type IssueDefinition
} from './lib/issue-registry';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Severity config
// ---------------------------------------------------------------------------

const severityConfig: Record<
  Severity,
  { dot: string; badge: string; text: string; bar: string; label: string }
> = {
  critical: {
    dot: 'bg-red-500',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
    text: 'text-red-600 dark:text-red-400',
    bar: '[&_[data-slot=progress-indicator]]:bg-red-500',
    label: 'Critical'
  },
  warning: {
    dot: 'bg-amber-500',
    badge:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
    text: 'text-amber-600 dark:text-amber-400',
    bar: '[&_[data-slot=progress-indicator]]:bg-amber-500',
    label: 'Warning'
  },
  opportunity: {
    dot: 'bg-sky-500',
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300',
    text: 'text-sky-600 dark:text-sky-400',
    bar: '[&_[data-slot=progress-indicator]]:bg-sky-500',
    label: 'Opportunity'
  },
  info: {
    dot: 'bg-slate-400',
    badge:
      'bg-slate-100 text-slate-700 dark:bg-slate-900/20 dark:text-slate-300',
    text: 'text-slate-600 dark:text-slate-400',
    bar: '[&_[data-slot=progress-indicator]]:bg-slate-500',
    label: 'Info'
  }
};

// ---------------------------------------------------------------------------
// Sub-components at module scope
// ---------------------------------------------------------------------------

function DeltaBadge({
  current,
  previous,
  inverse = false
}: {
  current: number;
  previous: number | null;
  inverse?: boolean;
}) {
  if (previous === null) return null;
  const diff = current - previous;
  if (diff === 0) return null;
  const isUp = diff > 0;
  const isGood = inverse ? isUp : !isUp;
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

function SummaryCard({
  label,
  count,
  prevCount,
  denominator,
  color,
  barColor,
  inverse = false
}: {
  label: string;
  count: number;
  prevCount: number | null;
  denominator: number;
  color: string;
  barColor: string;
  inverse?: boolean;
}) {
  const pct = denominator > 0 ? Math.round((count / denominator) * 100) : 0;
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
          {denominator > 0 && (
            <span className='text-muted-foreground text-xs'>{pct}%</span>
          )}
          <DeltaBadge current={count} previous={prevCount} inverse={inverse} />
        </div>
        <Progress value={Math.min(pct, 100)} className={`h-1.5 ${barColor}`} />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main component (server component — no 'use client')
// ---------------------------------------------------------------------------

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
        <SummaryCard
          label='Health Score'
          count={latest?.score ?? 0}
          prevCount={previous?.score ?? null}
          denominator={100}
          color='text-emerald-600 dark:text-emerald-400'
          barColor='[&_[data-slot=progress-indicator]]:bg-emerald-500'
          inverse={true}
        />
        <SummaryCard
          label='Total Pages'
          count={totalPages}
          prevCount={
            previous
              ? (prevVal('pages_200_response') ?? 0) +
                (prevVal('pages_3xx_response') ?? 0) +
                (prevVal('pages_4xx_response') ?? 0) +
                (prevVal('pages_5xx_response') ?? 0)
              : null
          }
          denominator={totalPages}
          color='text-slate-600 dark:text-slate-400'
          barColor='[&_[data-slot=progress-indicator]]:bg-slate-500'
          inverse={true}
        />
        <SummaryCard
          label='Critical Issues'
          count={criticalIssues}
          prevCount={prevCritical}
          denominator={totalPages}
          color={severityConfig.critical.text}
          barColor={severityConfig.critical.bar}
        />
        <SummaryCard
          label='Warnings'
          count={warnings}
          prevCount={prevWarnings}
          denominator={totalPages}
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
            <div>
              <h3 className='text-lg font-semibold'>{section.title}</h3>
              <p className='text-muted-foreground mt-1 text-sm'>
                {section.description}
              </p>
            </div>

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
            <div>
              <h3 className='text-lg font-semibold'>AI-Powered Insights</h3>
              <p className='text-muted-foreground mt-1 text-sm'>
                Patterns detected using content analysis and machine learning
              </p>
            </div>

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

// ---------------------------------------------------------------------------
// Issue row — module-scope sub-component
// ---------------------------------------------------------------------------

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

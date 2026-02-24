'use client';

import { useEffect, useState, useTransition, useMemo } from 'react';
import { Heading } from '@/components/ui/heading';
import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  IconAlertTriangle,
  IconFileText,
  IconUsers,
  IconExternalLink,
  IconChevronDown,
  IconChevronRight
} from '@tabler/icons-react';
import Link from 'next/link';

interface CannibalisationViewProps {
  clientId: string;
}

interface Issue {
  id: number;
  url: string;
  metadata: Record<string, unknown> | null;
}

interface GroupedIssue {
  groupId: string;
  urls: string[];
}

export default function CannibalisationView({
  clientId
}: CannibalisationViewProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const res = await fetch(
          `/api/clients/${clientId}/audits/issues/cannibalisation_group?perPage=1000`
        );
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setIssues(data.issues || []);
      } catch {
        setIssues([]);
      } finally {
        setIsLoading(false);
      }
    };

    startTransition(() => {
      fetchIssues();
    });
  }, [clientId]);

  const groups = useMemo(() => {
    const grouped: Record<string, string[]> = {};

    issues.forEach((issue) => {
      const groupId =
        (issue.metadata?.group as string) ||
        (issue.metadata?.topic as string) ||
        (issue.metadata?.keyword as string) ||
        'Ungrouped';

      if (!grouped[groupId]) {
        grouped[groupId] = [];
      }
      grouped[groupId].push(issue.url);
    });

    return Object.entries(grouped)
      .map(([groupId, urls]) => ({ groupId, urls }))
      .sort((a, b) => b.urls.length - a.urls.length);
  }, [issues]);

  // Compute summary metrics
  const totalGroups = groups.length;
  const totalAffectedPages = issues.length;
  const largestGroup = groups.length > 0 ? groups[0].urls.length : 0;
  const criticalGroups = groups.filter((g) => g.urls.length >= 5).length;

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  function getSeverityColor(pageCount: number) {
    if (pageCount >= 5)
      return {
        badge: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
        border: 'border-l-red-500',
        label: 'Critical'
      };
    if (pageCount >= 3)
      return {
        badge:
          'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
        border: 'border-l-amber-500',
        label: 'Warning'
      };
    return {
      badge:
        'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300',
      border: 'border-l-orange-500',
      label: 'Conflict'
    };
  }

  function SummaryCard({
    icon: Icon,
    label,
    value,
    subtitle,
    color
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string | number;
    subtitle?: string;
    color: string;
  }) {
    return (
      <Card>
        <CardContent className='flex items-center gap-4 py-4'>
          <div className={`rounded-lg p-2.5 ${color}`}>
            <Icon className='h-5 w-5' />
          </div>
          <div className='flex flex-col'>
            <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
              {label}
            </p>
            <p className='text-2xl font-bold tabular-nums'>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {subtitle && (
              <p className='text-muted-foreground text-xs'>{subtitle}</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  function LoadingSkeleton() {
    return (
      <div className='flex flex-1 flex-col gap-6'>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className='flex items-center gap-4 py-4'>
                <Skeleton className='h-10 w-10 rounded-lg' />
                <div className='flex flex-col gap-2'>
                  <Skeleton className='h-3 w-20' />
                  <Skeleton className='h-7 w-16' />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className='space-y-4'>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className='h-24 rounded-lg' />
          ))}
        </div>
      </div>
    );
  }

  function EmptyState() {
    return (
      <Card className='flex min-h-[400px] flex-col items-center justify-center'>
        <CardContent className='flex flex-col items-center gap-4 py-10'>
          <div className='rounded-full bg-emerald-100 p-4 dark:bg-emerald-900/20'>
            <IconAlertTriangle className='h-8 w-8 text-emerald-600 dark:text-emerald-400' />
          </div>
          <div className='text-center'>
            <h3 className='text-lg font-semibold'>
              No cannibalisation detected
            </h3>
            <p className='text-muted-foreground mt-1 text-sm'>
              Great news! No pages are competing for the same keywords.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || (isPending && issues.length === 0)) {
    return (
      <PageContainer>
        <div className='flex flex-1 flex-col gap-6'>
          <Heading
            title='Keyword Cannibalisation'
            description='Pages competing for the same keywords or search intent'
          />
          <LoadingSkeleton />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col gap-6'>
        <Heading
          title='Keyword Cannibalisation'
          description='Pages competing for the same keywords or search intent'
        />

        {groups.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Summary Cards */}
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
              <SummaryCard
                icon={IconUsers}
                label='Conflict Groups'
                value={totalGroups}
                subtitle='Keyword conflicts found'
                color='bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
              />
              <SummaryCard
                icon={IconFileText}
                label='Affected Pages'
                value={totalAffectedPages}
                subtitle='Pages with conflicts'
                color='bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
              />
              <SummaryCard
                icon={IconAlertTriangle}
                label='Critical Groups'
                value={criticalGroups}
                subtitle='Groups with 5+ pages'
                color='bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
              />
              <SummaryCard
                icon={IconUsers}
                label='Largest Group'
                value={largestGroup}
                subtitle='Pages in biggest conflict'
                color='bg-violet-100 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400'
              />
            </div>

            {/* Groups List */}
            <Card>
              <CardHeader className='pb-3'>
                <CardTitle className='text-base'>
                  Cannibalisation Groups
                </CardTitle>
                <CardDescription className='text-xs'>
                  Click to expand and see affected pages
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-2'>
                {groups.map((group) => {
                  const severity = getSeverityColor(group.urls.length);
                  const isExpanded = expandedGroups.has(group.groupId);
                  const pct =
                    totalAffectedPages > 0
                      ? Math.round(
                          (group.urls.length / totalAffectedPages) * 100
                        )
                      : 0;

                  return (
                    <div
                      key={group.groupId}
                      className={`rounded-lg border border-l-4 ${severity.border}`}
                    >
                      <button
                        onClick={() => toggleGroup(group.groupId)}
                        className='hover:bg-muted/50 flex w-full items-center justify-between px-4 py-3 text-left transition-colors'
                      >
                        <div className='flex items-center gap-3'>
                          {isExpanded ? (
                            <IconChevronDown className='text-muted-foreground h-4 w-4' />
                          ) : (
                            <IconChevronRight className='text-muted-foreground h-4 w-4' />
                          )}
                          <Badge
                            variant='outline'
                            className={`border-transparent text-[10px] ${severity.badge}`}
                          >
                            {severity.label}
                          </Badge>
                          <span className='font-medium'>
                            {group.groupId !== 'Ungrouped'
                              ? group.groupId
                              : 'Uncategorized Conflicts'}
                          </span>
                        </div>
                        <div className='flex items-center gap-4'>
                          <div className='flex items-center gap-2'>
                            <span className='font-bold tabular-nums'>
                              {group.urls.length}
                            </span>
                            <span className='text-muted-foreground text-xs'>
                              pages ({pct}%)
                            </span>
                          </div>
                          <Progress
                            value={pct}
                            className='h-1.5 w-16 [&_[data-slot=progress-indicator]]:bg-orange-500'
                          />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className='border-t px-4 py-3'>
                          <p className='text-muted-foreground mb-3 text-xs'>
                            These pages are competing for the same keyword or
                            intent:
                          </p>
                          <div className='space-y-2'>
                            {group.urls.map((url, i) => (
                              <div
                                key={i}
                                className='bg-muted/40 flex items-center justify-between rounded-md border px-3 py-2'
                              >
                                <span
                                  className='flex-1 truncate text-sm font-medium'
                                  title={url}
                                >
                                  {url.replace(/^https?:\/\/[^/]+/, '')}
                                </span>
                                <Link
                                  href={url}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                >
                                  <Button
                                    variant='ghost'
                                    size='icon'
                                    className='h-7 w-7'
                                  >
                                    <IconExternalLink className='h-3.5 w-3.5' />
                                  </Button>
                                </Link>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader className='pb-3'>
                <CardTitle className='text-base'>Recommendations</CardTitle>
                <CardDescription className='text-xs'>
                  How to resolve keyword cannibalisation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <div className='flex items-start gap-3'>
                    <div className='bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold'>
                      1
                    </div>
                    <div>
                      <p className='text-sm font-medium'>
                        Consolidate similar content
                      </p>
                      <p className='text-muted-foreground text-xs'>
                        Merge pages targeting the same keyword into one
                        comprehensive page.
                      </p>
                    </div>
                  </div>
                  <div className='flex items-start gap-3'>
                    <div className='bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold'>
                      2
                    </div>
                    <div>
                      <p className='text-sm font-medium'>
                        Differentiate intent
                      </p>
                      <p className='text-muted-foreground text-xs'>
                        Update page content to target different variations or
                        long-tail keywords.
                      </p>
                    </div>
                  </div>
                  <div className='flex items-start gap-3'>
                    <div className='bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold'>
                      3
                    </div>
                    <div>
                      <p className='text-sm font-medium'>Use canonical tags</p>
                      <p className='text-muted-foreground text-xs'>
                        Point secondary pages to the main page you want to rank.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PageContainer>
  );
}

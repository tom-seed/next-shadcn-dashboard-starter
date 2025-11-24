'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useQueryStates,
  parseAsInteger,
  parseAsString,
  createParser
} from 'nuqs';
import { toast } from 'sonner';
import { TaskTable } from './task-table';
import { getTaskColumns, Task } from './columns';
import { TaskStats } from './task-stats';
import { SortingState, ColumnFiltersState } from '@tanstack/react-table';

// Custom parser for array of strings (sort)
const parseSortParam = createParser<string[]>({
  parse: (value): string[] => {
    if (Array.isArray(value))
      return value.filter((entry) => typeof entry === 'string') as string[];
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((part) => part.trim())
        .filter((part) => part.length > 0);
    }
    return [];
  },
  serialize: (value: string[]): string => value.join(',')
});

const searchParamDefs = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  status: parseAsString.withDefault(''),
  priority: parseAsString.withDefault(''),
  search: parseAsString.withDefault(''),
  sort: parseSortParam.withDefault([])
};

interface TaskViewProps {
  clientId: number;
}

export default function TaskView({ clientId }: TaskViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const activeRequestRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [searchParams, setSearchParams] = useQueryStates(searchParamDefs);
  const { page, perPage, status, priority, search, sort } = searchParams;

  const [sortingState, setSortingState] = useState<SortingState>([]);

  // Sync URL params to table state
  useEffect(() => {
    const parsedSorting = sort
      .map((entry) => {
        const [id, direction] = entry.split(':');
        return { id, desc: direction === 'desc' };
      })
      .filter((item) => item.id && item.desc !== undefined);

    setSortingState(parsedSorting);
  }, [sort]);

  const fetchData = useCallback(async () => {
    const query = new URLSearchParams({
      page: String(page),
      perPage: String(perPage)
    });

    if (status) query.append('status', status);
    if (priority) query.append('priority', priority);
    if (search) query.append('search', search);

    sort.forEach((s) => query.append('sort', s));

    const urlPath = `/api/clients/${clientId}/tasks?${query.toString()}`;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const requestId = ++activeRequestRef.current;
    setIsFetching(true);

    try {
      const res = await fetch(urlPath, {
        signal: controller.signal,
        cache: 'no-store'
      });

      if (!res.ok) throw new Error(`Request failed: ${res.status}`);

      const data = await res.json();

      if (requestId === activeRequestRef.current) {
        setTasks(data.tasks || []);
        setTotalItems(data.totalCount || 0);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Failed to fetch tasks', error);
        toast.error('Failed to load tasks');
      }
    } finally {
      if (requestId === activeRequestRef.current) {
        setIsFetching(false);
      }
    }
  }, [clientId, page, perPage, status, priority, search, sort]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    void fetchData();
  };

  const columns = getTaskColumns(clientId, handleRefresh);

  return (
    <div className='space-y-4'>
      {/* TaskStats might need update if it expects AuditIssue, but we'll check that next */}
      {/* <TaskStats tasks={tasks} totalItems={totalItems} /> */}
      <TaskTable
        data={tasks}
        totalItems={totalItems}
        columns={columns}
        isLoading={isFetching}
        page={page}
        perPage={perPage}
        onPageChange={(p) => setSearchParams({ page: p })}
        onPerPageChange={(p) => setSearchParams({ perPage: p, page: 1 })}
        sorting={sortingState}
        onSortingChange={(updater) => {
          const nextSort =
            typeof updater === 'function'
              ? (updater as (old: SortingState) => SortingState)(sortingState)
              : updater;
          setSortingState(nextSort);
          const sortParams = nextSort.map(
            (s: { id: string; desc: boolean }) =>
              `${s.id}:${s.desc ? 'desc' : 'asc'}`
          );
          setSearchParams({ sort: sortParams });
        }}
      />
    </div>
  );
}

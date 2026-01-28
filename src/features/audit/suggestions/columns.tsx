'use client';

import { ColumnDef } from '@tanstack/react-table';

export type SuggestionRow = {
  id: number;
  sourceUrl: string;
  targetUrl: string;
  anchorText: string | null;
  score: number;
};

export const columns: ColumnDef<SuggestionRow>[] = [
  {
    accessorKey: 'sourceUrl',
    header: 'Source URL',
    cell: ({ row }) => (
      <div className='max-w-[300px] truncate' title={row.original.sourceUrl}>
        {row.original.sourceUrl}
      </div>
    )
  },
  {
    accessorKey: 'targetUrl',
    header: 'Suggested Target',
    cell: ({ row }) => (
      <div className='max-w-[300px] truncate' title={row.original.targetUrl}>
        {row.original.targetUrl}
      </div>
    )
  },
  {
    accessorKey: 'anchorText',
    header: 'Anchor Text',
    cell: ({ row }) => row.original.anchorText || '-'
  },
  {
    accessorKey: 'score',
    header: 'Score',
    cell: ({ row }) => row.original.score.toFixed(4)
  }
];

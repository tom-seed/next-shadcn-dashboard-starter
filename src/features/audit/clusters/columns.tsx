'use client';

import { ColumnDef } from '@tanstack/react-table';

export type ClusterRow = {
  id: number;
  label: string | null;
  density: number | null;
  memberCount: number;
};

export const columns: ColumnDef<ClusterRow>[] = [
  {
    accessorKey: 'label',
    header: 'Topic Label',
    cell: ({ row }) => (
      <span className='font-medium'>
        {row.original.label || 'Unlabeled Cluster'}
      </span>
    )
  },
  {
    accessorKey: 'density',
    header: 'Density Score',
    cell: ({ row }) => <span>{row.original.density?.toFixed(4) ?? 'N/A'}</span>
  },
  {
    accessorKey: 'memberCount',
    header: 'Page Count'
  }
];

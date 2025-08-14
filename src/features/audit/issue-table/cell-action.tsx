'use client';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { IconEdit, IconDotsVertical } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface UrlCellActionProps {
  clientId: number;
  urlId?: number;
}

export const UrlCellAction: React.FC<UrlCellActionProps> = ({
  clientId,
  urlId
}) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const disabled = !urlId;

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={() => {}}
        loading={false}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Open menu</span>
            <IconDotsVertical className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            disabled={disabled}
            onClick={() => {
              if (!urlId) return;
              router.push(`/dashboard/${clientId}/urls/${urlId}`);
            }}
          >
            <IconEdit className='mr-2 h-4 w-4' /> View
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

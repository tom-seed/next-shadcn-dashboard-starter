'use client';

import { useUser } from '@clerk/nextjs';
import { InviteUserDialog } from './invite-user-dialog';
import { Button } from '@/components/ui/button';
import { IconUserPlus } from '@tabler/icons-react';

interface ClientHeaderProps {
  clientId: number;
  showInvite?: boolean;
}

export function ClientHeader({
  clientId,
  showInvite = true
}: ClientHeaderProps) {
  const { user } = useUser();

  // Check if user has agency role from public metadata
  const userRoles =
    (user?.publicMetadata?.roles as string[]) ||
    (user?.unsafeMetadata?.roles as string[]) ||
    [];

  const isAgencyUser = userRoles.some((role: string) =>
    ['AGENCY_ADMIN', 'AGENCY_ANALYST', 'INTERNAL_ADMIN'].includes(role)
  );

  if (!showInvite || !isAgencyUser) {
    return null;
  }

  return (
    <div className='flex items-center justify-end gap-2'>
      <InviteUserDialog
        clientId={clientId}
        trigger={
          <Button variant='outline' size='sm'>
            <IconUserPlus className='mr-2 h-4 w-4' />
            Invite User
          </Button>
        }
      />
    </div>
  );
}

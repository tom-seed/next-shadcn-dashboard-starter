// app/dashboard/overview/page.tsx
import PageContainer from '@/components/layout/page-container';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Heading } from '@/components/ui/heading';
import { getClientsOverviewForUser } from '@/lib/getClientOverview';
import { ClientRole } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getClientMembershipsForUser } from '@/lib/auth/memberships';
import { CreateClientDialog } from '@/components/common/create-client-dialog';
import { ClientOverviewRow } from '@/components/common/client-overview-row';
import { isGlobalAdmin } from '@/lib/auth/global-role';

export default async function OverViewPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/auth/sign-in');
  }

  const [memberships, globalAdmin] = await Promise.all([
    getClientMembershipsForUser(userId),
    isGlobalAdmin(userId)
  ]);

  const ADMIN_ROLES = new Set<ClientRole>([
    ClientRole.INTERNAL_ADMIN,
    ClientRole.CLIENT_ADMIN,
    ClientRole.AGENCY_ADMIN,
    ClientRole.AGENCY_ANALYST
  ]);

  const hasAdminRoleOnAnyClient = memberships.some((m) =>
    ADMIN_ROLES.has(m.role)
  );

  const hasAdminAccess = globalAdmin || hasAdminRoleOnAnyClient;

  if (!hasAdminAccess && memberships.length === 1) {
    redirect(`/dashboard/${memberships[0].clientId}/overview`);
  }

  const data = await getClientsOverviewForUser(userId);
  const isDev = process.env.NODE_ENV === 'development';

  if (!memberships.length && !globalAdmin && !isDev) {
    return (
      <PageContainer>
        <div className='flex w-full flex-col space-y-4'>
          <div className='flex items-center justify-between'>
            <Heading
              title='Clients'
              description='All clients and their latest crawl snapshot.'
            />
            {hasAdminAccess && <CreateClientDialog />}
          </div>
          <Separator />
          <div className='text-muted-foreground text-sm'>
            No clients yet.
            {!hasAdminAccess &&
              ' You do not have access to any clients. Contact an administrator to be added.'}
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!data || data.length === 0) {
    return (
      <PageContainer>
        <div className='flex w-full flex-col space-y-4'>
          <div className='flex items-center justify-between'>
            <Heading
              title='Clients'
              description='All clients and their latest crawl snapshot.'
            />
            {hasAdminAccess && <CreateClientDialog />}
          </div>
          <Separator />
          <div className='text-muted-foreground text-sm'>No clients found.</div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='flex w-full flex-col space-y-4'>
        <div className='flex items-center justify-between'>
          <Heading
            title='Clients'
            description='All clients and their latest crawl snapshot.'
          />
          {hasAdminAccess && <CreateClientDialog />}
        </div>
        <Separator />

        <Card>
          <div className='text-muted-foreground grid grid-cols-6 gap-4 p-4 text-sm font-medium'>
            <div className='col-span-2'>Client</div>
            <div>Health Score</div>
            <div>Pages Crawled</div>
            <div>Status</div>
            <div>Created</div>
          </div>
          <Separator />
          <div className='divide-border divide-y'>
            {data.map((client) => (
              <ClientOverviewRow key={client.id} client={client} />
            ))}
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}

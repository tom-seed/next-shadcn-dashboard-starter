import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import { ensureClientAccess } from '@/lib/auth/memberships';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { ClientSettingsForm } from '@/features/settings/client-settings-form';

const prisma = new PrismaClient().$extends(withAccelerate());

export default async function ClientSettingsPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/auth/sign-in');
  }

  const { clientId } = await params;
  const id = parseInt(clientId);

  if (isNaN(id)) {
    redirect('/dashboard/overview');
  }

  // Check if user has admin access to this client
  const membership = await ensureClientAccess(userId, id, [
    'INTERNAL_ADMIN',
    'CLIENT_ADMIN'
  ]);

  if (!membership) {
    redirect(`/dashboard/${id}/overview`);
  }

  // Fetch client details
  const client = await prisma.client.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      url: true,
      cron: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!client) {
    redirect('/dashboard/overview');
  }

  return (
    <PageContainer>
      <div className='flex w-full flex-col space-y-6'>
        <div>
          <Heading
            title='Client Settings'
            description='Manage your client configuration and settings.'
          />
        </div>
        <Separator />
        <ClientSettingsForm client={client} />
      </div>
    </PageContainer>
  );
}

import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import { ReactNode } from 'react';

import { ensureClientAccess } from '@/lib/auth/memberships';

interface LayoutProps {
  params: Promise<{ clientId: string }>;
  children: ReactNode;
}

export default async function ClientDashboardLayout({
  params,
  children
}: LayoutProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/auth/sign-in');
  }

  const { clientId } = await params;
  const parsedClientId = Number(clientId);

  if (!Number.isFinite(parsedClientId)) {
    notFound();
  }

  const membership = await ensureClientAccess(userId, parsedClientId);

  if (!membership) {
    notFound();
  }

  return <>{children}</>;
}

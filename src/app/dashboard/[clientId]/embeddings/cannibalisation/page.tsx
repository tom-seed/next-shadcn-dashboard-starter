import CannibalisationView from '@/features/audit/cannibalisation/cannibalisation-view';

interface PageProps {
  params: Promise<{ clientId: string }>;
}

export default async function Page({ params }: PageProps) {
  const { clientId } = await params;
  return <CannibalisationView clientId={clientId} />;
}

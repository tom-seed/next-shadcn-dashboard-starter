import ClustersView from '@/features/audit/clusters/clusters-view';

interface PageProps {
  params: Promise<{ clientId: string }>;
}

export default async function Page({ params }: PageProps) {
  const { clientId } = await params;
  return <ClustersView clientId={clientId} />;
}

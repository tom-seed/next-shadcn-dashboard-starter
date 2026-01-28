import ContentSimilarityView from '@/features/audit/content-similarity/content-similarity-view';

interface PageProps {
  params: Promise<{ clientId: string }>;
}

export default async function Page({ params }: PageProps) {
  const { clientId } = await params;
  return <ContentSimilarityView clientId={clientId} />;
}

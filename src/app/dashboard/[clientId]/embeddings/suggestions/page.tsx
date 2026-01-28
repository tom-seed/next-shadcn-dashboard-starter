import SuggestionsView from '@/features/audit/suggestions/suggestions-view';

interface PageProps {
  params: Promise<{ clientId: string }>;
}

export default async function Page({ params }: PageProps) {
  const { clientId } = await params;
  return <SuggestionsView clientId={clientId} />;
}

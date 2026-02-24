import 'server-only';
import prisma from '@/lib/db';

export async function getAuditComparisonData(clientId: number) {
  const audits = await prisma.audit.findMany({
    where: { clientId },
    orderBy: { createdAt: 'desc' },
    take: 2
  });

  const latest = audits[0] ?? null;
  const previous = audits[1] ?? null;

  if (!latest) {
    return { latest: null, previous: null, semantic: null };
  }

  const [cannibalisationCount, clusterCount, suggestionCount] =
    await Promise.all([
      prisma.auditIssue.count({
        where: {
          auditId: latest.id,
          issueKey: 'cannibalisation_group'
        }
      }),
      prisma.embeddingCluster.count({
        where: { crawlId: latest.crawlId }
      }),
      prisma.internalLinkSuggestion.count({
        where: { crawlId: latest.crawlId }
      })
    ]);

  return {
    latest,
    previous,
    semantic: {
      cannibalisation: cannibalisationCount,
      clusters: clusterCount,
      suggestions: suggestionCount
    }
  };
}

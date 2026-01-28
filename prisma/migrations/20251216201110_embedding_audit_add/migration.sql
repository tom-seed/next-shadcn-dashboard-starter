-- AlterTable
ALTER TABLE "Audit" ADD COLUMN     "pages_broken_link_recommendation" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pages_content_similarity" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ContentChange" (
    "id" SERIAL NOT NULL,
    "clientId" TEXT NOT NULL,
    "currentCrawlId" INTEGER NOT NULL,
    "previousCrawlId" INTEGER NOT NULL,
    "urlId" INTEGER NOT NULL,
    "changeType" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmbeddingCluster" (
    "id" SERIAL NOT NULL,
    "clientId" TEXT NOT NULL,
    "crawlId" INTEGER NOT NULL,
    "label" TEXT,
    "density" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmbeddingCluster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmbeddingClusterMember" (
    "id" SERIAL NOT NULL,
    "clusterId" INTEGER NOT NULL,
    "urlId" INTEGER NOT NULL,
    "isHub" BOOLEAN NOT NULL DEFAULT false,
    "distanceToHub" DOUBLE PRECISION,

    CONSTRAINT "EmbeddingClusterMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalLinkSuggestion" (
    "id" SERIAL NOT NULL,
    "clientId" TEXT NOT NULL,
    "crawlId" INTEGER NOT NULL,
    "sourceUrlId" INTEGER NOT NULL,
    "targetUrlId" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "anchorText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalLinkSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentChange_currentCrawlId_idx" ON "ContentChange"("currentCrawlId");

-- CreateIndex
CREATE INDEX "ContentChange_urlId_idx" ON "ContentChange"("urlId");

-- CreateIndex
CREATE INDEX "EmbeddingCluster_crawlId_idx" ON "EmbeddingCluster"("crawlId");

-- CreateIndex
CREATE INDEX "EmbeddingCluster_clientId_crawlId_idx" ON "EmbeddingCluster"("clientId", "crawlId");

-- CreateIndex
CREATE INDEX "EmbeddingClusterMember_urlId_idx" ON "EmbeddingClusterMember"("urlId");

-- CreateIndex
CREATE UNIQUE INDEX "EmbeddingClusterMember_clusterId_urlId_key" ON "EmbeddingClusterMember"("clusterId", "urlId");

-- CreateIndex
CREATE INDEX "InternalLinkSuggestion_crawlId_idx" ON "InternalLinkSuggestion"("crawlId");

-- CreateIndex
CREATE INDEX "InternalLinkSuggestion_sourceUrlId_idx" ON "InternalLinkSuggestion"("sourceUrlId");

-- CreateIndex
CREATE UNIQUE INDEX "InternalLinkSuggestion_sourceUrlId_targetUrlId_key" ON "InternalLinkSuggestion"("sourceUrlId", "targetUrlId");

-- AddForeignKey
ALTER TABLE "ContentChange" ADD CONSTRAINT "ContentChange_currentCrawlId_fkey" FOREIGN KEY ("currentCrawlId") REFERENCES "Crawl"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentChange" ADD CONSTRAINT "ContentChange_previousCrawlId_fkey" FOREIGN KEY ("previousCrawlId") REFERENCES "Crawl"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentChange" ADD CONSTRAINT "ContentChange_urlId_fkey" FOREIGN KEY ("urlId") REFERENCES "Urls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmbeddingCluster" ADD CONSTRAINT "EmbeddingCluster_crawlId_fkey" FOREIGN KEY ("crawlId") REFERENCES "Crawl"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmbeddingClusterMember" ADD CONSTRAINT "EmbeddingClusterMember_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "EmbeddingCluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmbeddingClusterMember" ADD CONSTRAINT "EmbeddingClusterMember_urlId_fkey" FOREIGN KEY ("urlId") REFERENCES "Urls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalLinkSuggestion" ADD CONSTRAINT "InternalLinkSuggestion_crawlId_fkey" FOREIGN KEY ("crawlId") REFERENCES "Crawl"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalLinkSuggestion" ADD CONSTRAINT "InternalLinkSuggestion_sourceUrlId_fkey" FOREIGN KEY ("sourceUrlId") REFERENCES "Urls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalLinkSuggestion" ADD CONSTRAINT "InternalLinkSuggestion_targetUrlId_fkey" FOREIGN KEY ("targetUrlId") REFERENCES "Urls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Audit" ADD COLUMN     "pages_blocked_by_robots" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pages_broken_pagination" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pages_deep" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pages_duplicate_description" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pages_duplicate_title" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pages_exact_duplicate_content" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pages_in_redirect_chain" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pages_in_sitemap_non_200" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pages_in_sitemap_not_crawled" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pages_missing_schema" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pages_nofollow" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pages_noindex" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pages_non_indexable" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pages_not_in_sitemap" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pages_slow_response" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pages_thin_content" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pages_with_mixed_content" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pages_with_schema" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Urls" ADD COLUMN     "depth" INTEGER,
ADD COLUMN     "hasSchemaMarkup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isNofollow" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isNoindex" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "metaRobots" TEXT,
ADD COLUMN     "responseTimeMs" INTEGER,
ADD COLUMN     "schemaTypes" TEXT[],
ADD COLUMN     "wordCount" INTEGER;

-- CreateTable
CREATE TABLE "CrawlMeta" (
    "id" SERIAL NOT NULL,
    "crawlId" INTEGER NOT NULL,
    "robotsTxtRaw" TEXT,
    "robotsTxtRules" JSONB,
    "sitemapUrls" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrawlMeta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CrawlMeta_crawlId_key" ON "CrawlMeta"("crawlId");

-- AddForeignKey
ALTER TABLE "CrawlMeta" ADD CONSTRAINT "CrawlMeta_crawlId_fkey" FOREIGN KEY ("crawlId") REFERENCES "Crawl"("id") ON DELETE CASCADE ON UPDATE CASCADE;

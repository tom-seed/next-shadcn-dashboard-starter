-- DropIndex
DROP INDEX "public"."HreflangLink_hreflang_idx";

-- AlterTable
ALTER TABLE "Audit" ADD COLUMN     "canonical_points_to_404" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "canonical_points_to_4xx" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "canonical_points_to_5xx" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "canonical_points_to_redirect" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Image" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "crawlId" INTEGER NOT NULL,
    "urlId" INTEGER NOT NULL,
    "src" TEXT NOT NULL,
    "alt" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "format" TEXT,
    "isOptimizedFormat" BOOLEAN NOT NULL DEFAULT false,
    "hasDimensions" BOOLEAN NOT NULL DEFAULT false,
    "hasAlt" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Image_clientId_idx" ON "Image"("clientId");

-- CreateIndex
CREATE INDEX "Image_crawlId_idx" ON "Image"("crawlId");

-- CreateIndex
CREATE INDEX "Image_urlId_idx" ON "Image"("urlId");

-- CreateIndex
CREATE INDEX "Image_hasAlt_idx" ON "Image"("hasAlt");

-- CreateIndex
CREATE INDEX "Image_hasDimensions_idx" ON "Image"("hasDimensions");

-- CreateIndex
CREATE INDEX "Image_isOptimizedFormat_idx" ON "Image"("isOptimizedFormat");

-- CreateIndex
CREATE INDEX "HreflangLink_crawlId_sourceId_idx" ON "HreflangLink"("crawlId", "sourceId");

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_crawlId_fkey" FOREIGN KEY ("crawlId") REFERENCES "Crawl"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_urlId_fkey" FOREIGN KEY ("urlId") REFERENCES "Urls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

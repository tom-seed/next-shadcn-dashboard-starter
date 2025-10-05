/*
  Warnings:

  - A unique constraint covering the columns `[sourceId,targetUrl,crawlId]` on the table `InternalLink` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `clientId` to the `InternalLink` table without a default value. This is not possible if the table is not empty.
  - Added the required column `crawlId` to the `InternalLink` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."InternalLink" DROP CONSTRAINT "InternalLink_sourceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."InternalLink" DROP CONSTRAINT "InternalLink_targetId_fkey";

-- DropIndex
DROP INDEX "public"."InternalLink_sourceId_targetUrl_key";

-- AlterTable
ALTER TABLE "InternalLink" ADD COLUMN     "anchor" TEXT,
ADD COLUMN     "clientId" INTEGER NOT NULL,
ADD COLUMN     "crawlId" INTEGER NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "follow" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "rel" TEXT;

-- CreateTable
CREATE TABLE "HreflangLink" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "crawlId" INTEGER NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "targetId" INTEGER,
    "hreflang" TEXT NOT NULL,
    "hasReturnTag" BOOLEAN NOT NULL DEFAULT false,
    "targetStatus" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HreflangLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HreflangLink_clientId_crawlId_idx" ON "HreflangLink"("clientId", "crawlId");

-- CreateIndex
CREATE INDEX "HreflangLink_targetUrl_idx" ON "HreflangLink"("targetUrl");

-- CreateIndex
CREATE INDEX "HreflangLink_hreflang_idx" ON "HreflangLink"("hreflang");

-- CreateIndex
CREATE UNIQUE INDEX "HreflangLink_sourceId_hreflang_crawlId_key" ON "HreflangLink"("sourceId", "hreflang", "crawlId");

-- CreateIndex
CREATE INDEX "InternalLink_clientId_crawlId_idx" ON "InternalLink"("clientId", "crawlId");

-- CreateIndex
CREATE INDEX "InternalLink_targetUrl_idx" ON "InternalLink"("targetUrl");

-- CreateIndex
CREATE INDEX "InternalLink_follow_idx" ON "InternalLink"("follow");

-- CreateIndex
CREATE INDEX "InternalLink_sourceId_idx" ON "InternalLink"("sourceId");

-- CreateIndex
CREATE INDEX "InternalLink_targetId_idx" ON "InternalLink"("targetId");

-- CreateIndex
CREATE UNIQUE INDEX "InternalLink_sourceId_targetUrl_crawlId_key" ON "InternalLink"("sourceId", "targetUrl", "crawlId");

-- AddForeignKey
ALTER TABLE "InternalLink" ADD CONSTRAINT "InternalLink_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalLink" ADD CONSTRAINT "InternalLink_crawlId_fkey" FOREIGN KEY ("crawlId") REFERENCES "Crawl"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalLink" ADD CONSTRAINT "InternalLink_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Urls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalLink" ADD CONSTRAINT "InternalLink_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Urls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HreflangLink" ADD CONSTRAINT "HreflangLink_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HreflangLink" ADD CONSTRAINT "HreflangLink_crawlId_fkey" FOREIGN KEY ("crawlId") REFERENCES "Crawl"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HreflangLink" ADD CONSTRAINT "HreflangLink_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Urls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HreflangLink" ADD CONSTRAINT "HreflangLink_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Urls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - Changed the type of `clientId` on the `ContentChange` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `clientId` on the `EmbeddingCluster` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `clientId` on the `InternalLinkSuggestion` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "ContentChange" DROP COLUMN "clientId",
ADD COLUMN     "clientId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "EmbeddingCluster" DROP COLUMN "clientId",
ADD COLUMN     "clientId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "InternalLinkSuggestion" DROP COLUMN "clientId",
ADD COLUMN     "clientId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "EmbeddingCluster_clientId_crawlId_idx" ON "EmbeddingCluster"("clientId", "crawlId");

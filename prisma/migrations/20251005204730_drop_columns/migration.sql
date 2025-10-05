/*
  Warnings:

  - You are about to drop the column `anchor` on the `InternalLink` table. All the data in the column will be lost.
  - You are about to drop the column `rel` on the `InternalLink` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `InternalLink` table. All the data in the column will be lost.
  - You are about to drop the column `etag` on the `Urls` table. All the data in the column will be lost.
  - You are about to drop the column `externalLinks` on the `Urls` table. All the data in the column will be lost.
  - You are about to drop the column `internalLinks` on the `Urls` table. All the data in the column will be lost.
  - You are about to drop the column `structuredData` on the `Urls` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "InternalLink" DROP COLUMN "anchor",
DROP COLUMN "rel",
DROP COLUMN "status";

-- AlterTable
ALTER TABLE "Urls" DROP COLUMN "etag",
DROP COLUMN "externalLinks",
DROP COLUMN "internalLinks",
DROP COLUMN "structuredData";

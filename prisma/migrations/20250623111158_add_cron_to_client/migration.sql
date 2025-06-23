/*
  Warnings:

  - You are about to drop the column `rawHtml` on the `Urls` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "cron" TEXT;

-- AlterTable
ALTER TABLE "Urls" DROP COLUMN "rawHtml";

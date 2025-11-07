/*
  Warnings:

  - The `originalStatus` column on the `Urls` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Urls" DROP COLUMN "originalStatus",
ADD COLUMN     "originalStatus" INTEGER;

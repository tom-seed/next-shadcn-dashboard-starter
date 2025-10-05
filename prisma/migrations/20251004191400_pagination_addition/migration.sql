-- AlterTable
ALTER TABLE "Urls" ADD COLUMN     "isPagination" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paginationNext" TEXT,
ADD COLUMN     "paginationPrev" TEXT;

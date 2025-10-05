-- AlterTable
ALTER TABLE "Urls" ADD COLUMN     "etag" TEXT,
ADD COLUMN     "lastModified" TIMESTAMP(3),
ADD COLUMN     "structuredData" JSONB;

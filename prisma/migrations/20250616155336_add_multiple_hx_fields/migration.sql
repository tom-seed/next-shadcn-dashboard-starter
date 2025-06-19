-- AlterTable
ALTER TABLE "Audit" ADD COLUMN     "pages_with_multiple_h2s" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pages_with_multiple_h3s" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pages_with_multiple_h4s" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pages_with_multiple_h5s" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pages_with_multiple_h6s" INTEGER NOT NULL DEFAULT 0;

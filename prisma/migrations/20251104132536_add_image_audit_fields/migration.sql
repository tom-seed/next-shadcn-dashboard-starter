-- AlterTable
ALTER TABLE "Audit" ADD COLUMN     "pages_with_images_empty_alt" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pages_with_images_missing_alt" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pages_with_images_missing_dimensions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pages_with_unoptimized_image_format" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_images" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_images_empty_alt" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_images_missing_alt" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_images_missing_dimensions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_images_unoptimized_format" INTEGER NOT NULL DEFAULT 0;

/*
  Warnings:

  - You are about to alter the column `embedding` on the `CompletionEmbedding` table. The data in that column could be lost. The data in that column will be cast from `JsonB` to `Unsupported("vector(1536)")`.

*/
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- AlterTable
ALTER TABLE "public"."CompletionEmbedding" ALTER COLUMN "embedding" SET DATA TYPE vector(1536) USING "embedding"::text::vector(1536);

-- CreateIndex
CREATE INDEX "CompletionEmbedding_embedding_idx" ON "public"."CompletionEmbedding" USING hnsw ("embedding" vector_cosine_ops);

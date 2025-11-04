-- DropForeignKey
ALTER TABLE "public"."Audit" DROP CONSTRAINT "Audit_clientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Audit" DROP CONSTRAINT "Audit_crawlId_fkey";

-- AddForeignKey
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_crawlId_fkey" FOREIGN KEY ("crawlId") REFERENCES "Crawl"("id") ON DELETE CASCADE ON UPDATE CASCADE;

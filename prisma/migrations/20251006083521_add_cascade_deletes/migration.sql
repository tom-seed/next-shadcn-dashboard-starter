-- DropForeignKey
ALTER TABLE "public"."Audit" DROP CONSTRAINT "Audit_clientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Audit" DROP CONSTRAINT "Audit_crawlId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AuditIssue" DROP CONSTRAINT "AuditIssue_auditId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AuditIssue" DROP CONSTRAINT "AuditIssue_clientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AuditIssue" DROP CONSTRAINT "AuditIssue_urlId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Crawl" DROP CONSTRAINT "Crawl_clientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Urls" DROP CONSTRAINT "Urls_clientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Urls" DROP CONSTRAINT "Urls_crawlId_fkey";

-- AddForeignKey
ALTER TABLE "Crawl" ADD CONSTRAINT "Crawl_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Urls" ADD CONSTRAINT "Urls_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Urls" ADD CONSTRAINT "Urls_crawlId_fkey" FOREIGN KEY ("crawlId") REFERENCES "Crawl"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_crawlId_fkey" FOREIGN KEY ("crawlId") REFERENCES "Crawl"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditIssue" ADD CONSTRAINT "AuditIssue_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditIssue" ADD CONSTRAINT "AuditIssue_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditIssue" ADD CONSTRAINT "AuditIssue_urlId_fkey" FOREIGN KEY ("urlId") REFERENCES "Urls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

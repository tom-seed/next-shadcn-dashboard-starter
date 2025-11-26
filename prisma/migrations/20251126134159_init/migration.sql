-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'FIXED', 'IGNORED');

-- CreateEnum
CREATE TYPE "IssuePriority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "GlobalRole" AS ENUM ('NONE', 'INTERNAL_ADMIN');

-- CreateEnum
CREATE TYPE "ClientRole" AS ENUM ('INTERNAL_ADMIN', 'CLIENT_ADMIN', 'CLIENT_MEMBER', 'AGENCY_ADMIN', 'AGENCY_ANALYST', 'CLIENT_VIEWER');

-- CreateEnum
CREATE TYPE "CrawlState" AS ENUM ('STARTED', 'ABORTED', 'COMPLETED');

-- CreateTable
CREATE TABLE "Client" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "cron" TEXT,
    "clerkOrganizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientMembership" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "role" "ClientRole" NOT NULL DEFAULT 'CLIENT_MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "globalRole" "GlobalRole" NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Crawl" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "state" "CrawlState" NOT NULL DEFAULT 'STARTED',

    CONSTRAINT "Crawl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Urls" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "crawlId" INTEGER,
    "url" TEXT NOT NULL,
    "status" INTEGER,
    "redirectTarget" TEXT,
    "canonical" TEXT,
    "canonicalStatus" INTEGER,
    "isSelfReferencingCanonical" BOOLEAN NOT NULL DEFAULT false,
    "isCanonicalised" BOOLEAN NOT NULL DEFAULT false,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "h1" TEXT[],
    "h2" TEXT[],
    "h3" TEXT[],
    "h4" TEXT[],
    "h5" TEXT[],
    "h6" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastModified" TIMESTAMP(3),
    "isPagination" BOOLEAN NOT NULL DEFAULT false,
    "paginationNext" TEXT,
    "paginationPrev" TEXT,
    "originalStatus" INTEGER,

    CONSTRAINT "Urls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Audit" (
    "id" SERIAL NOT NULL,
    "crawlId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pages_missing_title" INTEGER NOT NULL DEFAULT 0,
    "too_short_title" INTEGER NOT NULL DEFAULT 0,
    "too_long_title" INTEGER NOT NULL DEFAULT 0,
    "pages_missing_description" INTEGER NOT NULL DEFAULT 0,
    "too_short_description" INTEGER NOT NULL DEFAULT 0,
    "too_long_description" INTEGER NOT NULL DEFAULT 0,
    "pages_missing_h1" INTEGER NOT NULL DEFAULT 0,
    "pages_with_multiple_h1s" INTEGER NOT NULL DEFAULT 0,
    "pages_with_duplicate_h1s" INTEGER NOT NULL DEFAULT 0,
    "pages_missing_h2" INTEGER NOT NULL DEFAULT 0,
    "pages_with_multiple_h2s" INTEGER NOT NULL DEFAULT 0,
    "pages_with_duplicate_h2s" INTEGER NOT NULL DEFAULT 0,
    "pages_missing_h3" INTEGER NOT NULL DEFAULT 0,
    "pages_with_multiple_h3s" INTEGER NOT NULL DEFAULT 0,
    "pages_with_duplicate_h3s" INTEGER NOT NULL DEFAULT 0,
    "pages_missing_h4" INTEGER NOT NULL DEFAULT 0,
    "pages_with_multiple_h4s" INTEGER NOT NULL DEFAULT 0,
    "pages_with_duplicate_h4s" INTEGER NOT NULL DEFAULT 0,
    "pages_missing_h5" INTEGER NOT NULL DEFAULT 0,
    "pages_with_multiple_h5s" INTEGER NOT NULL DEFAULT 0,
    "pages_with_duplicate_h5s" INTEGER NOT NULL DEFAULT 0,
    "pages_missing_h6" INTEGER NOT NULL DEFAULT 0,
    "pages_with_multiple_h6s" INTEGER NOT NULL DEFAULT 0,
    "pages_with_duplicate_h6s" INTEGER NOT NULL DEFAULT 0,
    "pages_200_response" INTEGER NOT NULL DEFAULT 0,
    "pages_3xx_response" INTEGER NOT NULL DEFAULT 0,
    "pages_4xx_response" INTEGER NOT NULL DEFAULT 0,
    "pages_5xx_response" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER,
    "pages_canonicalised" INTEGER NOT NULL DEFAULT 0,
    "pages_missing_canonical" INTEGER NOT NULL DEFAULT 0,
    "canonical_points_to_redirect" INTEGER NOT NULL DEFAULT 0,
    "canonical_points_to_404" INTEGER NOT NULL DEFAULT 0,
    "canonical_points_to_4xx" INTEGER NOT NULL DEFAULT 0,
    "canonical_points_to_5xx" INTEGER NOT NULL DEFAULT 0,
    "pages_hreflang_broken_links" INTEGER NOT NULL DEFAULT 0,
    "pages_hreflang_missing_return_tag" INTEGER NOT NULL DEFAULT 0,
    "pages_hreflang_missing_self_ref" INTEGER NOT NULL DEFAULT 0,
    "pages_missing_hreflang_x_default" INTEGER NOT NULL DEFAULT 0,
    "pages_orphaned" INTEGER NOT NULL DEFAULT 0,
    "pages_with_broken_internal_links" INTEGER NOT NULL DEFAULT 0,
    "pages_with_hreflang" INTEGER NOT NULL DEFAULT 0,
    "pages_with_redirect_links" INTEGER NOT NULL DEFAULT 0,
    "total_broken_internal_links" INTEGER NOT NULL DEFAULT 0,
    "total_hreflang_broken_links" INTEGER NOT NULL DEFAULT 0,
    "total_hreflang_links" INTEGER NOT NULL DEFAULT 0,
    "total_hreflang_missing_return_tags" INTEGER NOT NULL DEFAULT 0,
    "total_orphaned_pages" INTEGER NOT NULL DEFAULT 0,
    "total_redirect_internal_links" INTEGER NOT NULL DEFAULT 0,
    "pages_301_permanent" INTEGER NOT NULL DEFAULT 0,
    "pages_302_temporary" INTEGER NOT NULL DEFAULT 0,
    "pages_303_see_other" INTEGER NOT NULL DEFAULT 0,
    "pages_307_temporary" INTEGER NOT NULL DEFAULT 0,
    "pages_308_permanent" INTEGER NOT NULL DEFAULT 0,
    "pages_3xx_other" INTEGER NOT NULL DEFAULT 0,
    "pages_401_unauthorized" INTEGER NOT NULL DEFAULT 0,
    "pages_403_forbidden" INTEGER NOT NULL DEFAULT 0,
    "pages_404_not_found" INTEGER NOT NULL DEFAULT 0,
    "pages_405_method_not_allowed" INTEGER NOT NULL DEFAULT 0,
    "pages_408_timeout" INTEGER NOT NULL DEFAULT 0,
    "pages_410_gone" INTEGER NOT NULL DEFAULT 0,
    "pages_429_rate_limited" INTEGER NOT NULL DEFAULT 0,
    "pages_4xx_other" INTEGER NOT NULL DEFAULT 0,
    "pages_500_internal_error" INTEGER NOT NULL DEFAULT 0,
    "pages_502_bad_gateway" INTEGER NOT NULL DEFAULT 0,
    "pages_503_unavailable" INTEGER NOT NULL DEFAULT 0,
    "pages_504_timeout" INTEGER NOT NULL DEFAULT 0,
    "pages_5xx_other" INTEGER NOT NULL DEFAULT 0,
    "pages_with_images_empty_alt" INTEGER NOT NULL DEFAULT 0,
    "pages_with_images_missing_alt" INTEGER NOT NULL DEFAULT 0,
    "pages_with_images_missing_dimensions" INTEGER NOT NULL DEFAULT 0,
    "pages_with_unoptimized_image_format" INTEGER NOT NULL DEFAULT 0,
    "total_images" INTEGER NOT NULL DEFAULT 0,
    "total_images_empty_alt" INTEGER NOT NULL DEFAULT 0,
    "total_images_missing_alt" INTEGER NOT NULL DEFAULT 0,
    "total_images_missing_dimensions" INTEGER NOT NULL DEFAULT 0,
    "total_images_unoptimized_format" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageEmbedding" (
    "id" SERIAL NOT NULL,
    "urlId" INTEGER NOT NULL,
    "contentVector" vector(1536),
    "urlVector" vector(1536),
    "contentHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditIssue" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "auditId" INTEGER NOT NULL,
    "urlId" INTEGER NOT NULL,
    "issueKey" TEXT NOT NULL,
    "metadata" JSONB,
    "status" "IssueStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "IssuePriority" NOT NULL DEFAULT 'MEDIUM',
    "fixedAt" TIMESTAMP(3),
    "ignoredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "urlId" INTEGER,
    "auditIssueId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "IssueStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "IssuePriority" NOT NULL DEFAULT 'MEDIUM',
    "assigneeClerkUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "authorClerkUserId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalLink" (
    "id" SERIAL NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "targetId" INTEGER,
    "targetUrl" TEXT NOT NULL,
    "clientId" INTEGER NOT NULL,
    "crawlId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "follow" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "InternalLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HreflangLink" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "crawlId" INTEGER NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "targetId" INTEGER,
    "hreflang" TEXT NOT NULL,
    "hasReturnTag" BOOLEAN NOT NULL DEFAULT false,
    "targetStatus" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HreflangLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Image" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "crawlId" INTEGER NOT NULL,
    "urlId" INTEGER NOT NULL,
    "src" TEXT NOT NULL,
    "alt" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "format" TEXT,
    "isOptimizedFormat" BOOLEAN NOT NULL DEFAULT false,
    "hasDimensions" BOOLEAN NOT NULL DEFAULT false,
    "hasAlt" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientInvite" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "clientId" INTEGER NOT NULL,
    "role" "ClientRole" NOT NULL DEFAULT 'CLIENT_MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "inviterId" TEXT NOT NULL,

    CONSTRAINT "ClientInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_clerkOrganizationId_key" ON "Client"("clerkOrganizationId");

-- CreateIndex
CREATE INDEX "ClientMembership_clerkUserId_idx" ON "ClientMembership"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientMembership_clientId_clerkUserId_key" ON "ClientMembership"("clientId", "clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");

-- CreateIndex
CREATE INDEX "User_clerkUserId_idx" ON "User"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Urls_crawlId_url_key" ON "Urls"("crawlId", "url");

-- CreateIndex
CREATE UNIQUE INDEX "Audit_crawlId_key" ON "Audit"("crawlId");

-- CreateIndex
CREATE UNIQUE INDEX "PageEmbedding_urlId_key" ON "PageEmbedding"("urlId");

-- CreateIndex
CREATE INDEX "AuditIssue_clientId_idx" ON "AuditIssue"("clientId");

-- CreateIndex
CREATE INDEX "AuditIssue_auditId_idx" ON "AuditIssue"("auditId");

-- CreateIndex
CREATE INDEX "AuditIssue_issueKey_idx" ON "AuditIssue"("issueKey");

-- CreateIndex
CREATE INDEX "AuditIssue_status_idx" ON "AuditIssue"("status");

-- CreateIndex
CREATE INDEX "AuditIssue_priority_idx" ON "AuditIssue"("priority");

-- CreateIndex
CREATE INDEX "Task_clientId_idx" ON "Task"("clientId");

-- CreateIndex
CREATE INDEX "Task_urlId_idx" ON "Task"("urlId");

-- CreateIndex
CREATE INDEX "Task_auditIssueId_idx" ON "Task"("auditIssueId");

-- CreateIndex
CREATE INDEX "Comment_taskId_idx" ON "Comment"("taskId");

-- CreateIndex
CREATE INDEX "InternalLink_clientId_crawlId_idx" ON "InternalLink"("clientId", "crawlId");

-- CreateIndex
CREATE INDEX "InternalLink_targetUrl_idx" ON "InternalLink"("targetUrl");

-- CreateIndex
CREATE INDEX "InternalLink_follow_idx" ON "InternalLink"("follow");

-- CreateIndex
CREATE INDEX "InternalLink_sourceId_idx" ON "InternalLink"("sourceId");

-- CreateIndex
CREATE INDEX "InternalLink_targetId_idx" ON "InternalLink"("targetId");

-- CreateIndex
CREATE UNIQUE INDEX "InternalLink_sourceId_targetUrl_crawlId_key" ON "InternalLink"("sourceId", "targetUrl", "crawlId");

-- CreateIndex
CREATE INDEX "HreflangLink_clientId_crawlId_idx" ON "HreflangLink"("clientId", "crawlId");

-- CreateIndex
CREATE INDEX "HreflangLink_targetUrl_idx" ON "HreflangLink"("targetUrl");

-- CreateIndex
CREATE INDEX "HreflangLink_crawlId_sourceId_idx" ON "HreflangLink"("crawlId", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "HreflangLink_sourceId_hreflang_crawlId_key" ON "HreflangLink"("sourceId", "hreflang", "crawlId");

-- CreateIndex
CREATE INDEX "Image_clientId_idx" ON "Image"("clientId");

-- CreateIndex
CREATE INDEX "Image_crawlId_idx" ON "Image"("crawlId");

-- CreateIndex
CREATE INDEX "Image_urlId_idx" ON "Image"("urlId");

-- CreateIndex
CREATE INDEX "Image_hasAlt_idx" ON "Image"("hasAlt");

-- CreateIndex
CREATE INDEX "Image_hasDimensions_idx" ON "Image"("hasDimensions");

-- CreateIndex
CREATE INDEX "Image_isOptimizedFormat_idx" ON "Image"("isOptimizedFormat");

-- CreateIndex
CREATE UNIQUE INDEX "ClientInvite_token_key" ON "ClientInvite"("token");

-- CreateIndex
CREATE INDEX "ClientInvite_email_idx" ON "ClientInvite"("email");

-- CreateIndex
CREATE INDEX "ClientInvite_token_idx" ON "ClientInvite"("token");

-- AddForeignKey
ALTER TABLE "ClientMembership" ADD CONSTRAINT "ClientMembership_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "PageEmbedding" ADD CONSTRAINT "PageEmbedding_urlId_fkey" FOREIGN KEY ("urlId") REFERENCES "Urls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditIssue" ADD CONSTRAINT "AuditIssue_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditIssue" ADD CONSTRAINT "AuditIssue_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditIssue" ADD CONSTRAINT "AuditIssue_urlId_fkey" FOREIGN KEY ("urlId") REFERENCES "Urls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_auditIssueId_fkey" FOREIGN KEY ("auditIssueId") REFERENCES "AuditIssue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_urlId_fkey" FOREIGN KEY ("urlId") REFERENCES "Urls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalLink" ADD CONSTRAINT "InternalLink_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalLink" ADD CONSTRAINT "InternalLink_crawlId_fkey" FOREIGN KEY ("crawlId") REFERENCES "Crawl"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalLink" ADD CONSTRAINT "InternalLink_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Urls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalLink" ADD CONSTRAINT "InternalLink_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Urls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HreflangLink" ADD CONSTRAINT "HreflangLink_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HreflangLink" ADD CONSTRAINT "HreflangLink_crawlId_fkey" FOREIGN KEY ("crawlId") REFERENCES "Crawl"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HreflangLink" ADD CONSTRAINT "HreflangLink_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Urls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HreflangLink" ADD CONSTRAINT "HreflangLink_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Urls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_crawlId_fkey" FOREIGN KEY ("crawlId") REFERENCES "Crawl"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_urlId_fkey" FOREIGN KEY ("urlId") REFERENCES "Urls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientInvite" ADD CONSTRAINT "ClientInvite_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

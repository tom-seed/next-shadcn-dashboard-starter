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
    "originalStatus" TEXT,
    "redirectTarget" TEXT,
    "canonical" TEXT,
    "canonicalStatus" INTEGER,
    "isSelfReferencingCanonical" BOOLEAN NOT NULL DEFAULT false,
    "isCanonicalised" BOOLEAN NOT NULL DEFAULT false,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "internalLinks" TEXT[],
    "externalLinks" TEXT[],
    "h1" TEXT[],
    "h2" TEXT[],
    "h3" TEXT[],
    "h4" TEXT[],
    "h5" TEXT[],
    "h6" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

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

    CONSTRAINT "Audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditIssue" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "auditId" INTEGER NOT NULL,
    "urlId" INTEGER NOT NULL,
    "issueKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalLink" (
    "id" SERIAL NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "targetId" INTEGER,
    "targetUrl" TEXT NOT NULL,
    "status" INTEGER,

    CONSTRAINT "InternalLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientMembership_clerkUserId_idx" ON "ClientMembership"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientMembership_clientId_clerkUserId_key" ON "ClientMembership"("clientId", "clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Audit_crawlId_key" ON "Audit"("crawlId");

-- CreateIndex
CREATE INDEX "AuditIssue_clientId_idx" ON "AuditIssue"("clientId");

-- CreateIndex
CREATE INDEX "AuditIssue_auditId_idx" ON "AuditIssue"("auditId");

-- CreateIndex
CREATE INDEX "AuditIssue_issueKey_idx" ON "AuditIssue"("issueKey");

-- CreateIndex
CREATE UNIQUE INDEX "InternalLink_sourceId_targetUrl_key" ON "InternalLink"("sourceId", "targetUrl");

-- AddForeignKey
ALTER TABLE "ClientMembership" ADD CONSTRAINT "ClientMembership_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Crawl" ADD CONSTRAINT "Crawl_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Urls" ADD CONSTRAINT "Urls_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Urls" ADD CONSTRAINT "Urls_crawlId_fkey" FOREIGN KEY ("crawlId") REFERENCES "Crawl"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_crawlId_fkey" FOREIGN KEY ("crawlId") REFERENCES "Crawl"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditIssue" ADD CONSTRAINT "AuditIssue_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditIssue" ADD CONSTRAINT "AuditIssue_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditIssue" ADD CONSTRAINT "AuditIssue_urlId_fkey" FOREIGN KEY ("urlId") REFERENCES "Urls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalLink" ADD CONSTRAINT "InternalLink_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Urls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalLink" ADD CONSTRAINT "InternalLink_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Urls"("id") ON DELETE SET NULL ON UPDATE CASCADE;


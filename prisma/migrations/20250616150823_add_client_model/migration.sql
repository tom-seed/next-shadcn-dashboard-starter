-- CreateTable
CREATE TABLE "Client" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Crawl" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

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
    "internalLinkStatuses" JSONB NOT NULL,
    "rawHtml" TEXT,
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
    "pages_with_duplicate_h2s" INTEGER NOT NULL DEFAULT 0,
    "pages_missing_h3" INTEGER NOT NULL DEFAULT 0,
    "pages_with_duplicate_h3s" INTEGER NOT NULL DEFAULT 0,
    "pages_missing_h4" INTEGER NOT NULL DEFAULT 0,
    "pages_with_duplicate_h4s" INTEGER NOT NULL DEFAULT 0,
    "pages_missing_h5" INTEGER NOT NULL DEFAULT 0,
    "pages_with_duplicate_h5s" INTEGER NOT NULL DEFAULT 0,
    "pages_missing_h6" INTEGER NOT NULL DEFAULT 0,
    "pages_with_duplicate_h6s" INTEGER NOT NULL DEFAULT 0,
    "pages_200_response" INTEGER NOT NULL DEFAULT 0,
    "pages_3xx_response" INTEGER NOT NULL DEFAULT 0,
    "pages_4xx_response" INTEGER NOT NULL DEFAULT 0,
    "pages_5xx_response" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Audit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Audit_crawlId_key" ON "Audit"("crawlId");

-- AddForeignKey
ALTER TABLE "Crawl" ADD CONSTRAINT "Crawl_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Urls" ADD CONSTRAINT "Urls_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Urls" ADD CONSTRAINT "Urls_crawlId_fkey" FOREIGN KEY ("crawlId") REFERENCES "Crawl"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_crawlId_fkey" FOREIGN KEY ("crawlId") REFERENCES "Crawl"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

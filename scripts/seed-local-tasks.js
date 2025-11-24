/* eslint-disable no-console */
// Seed a small demo dataset for the Tasks view
// Uses the local Postgres connection (DATABASE_URL) so it works offline.
const fs = require('fs');
const envPath = fs.existsSync('.env.local') ? '.env.local' : '.env';
require('dotenv').config({ path: envPath });

// Always point seeding at the direct local Postgres instance.
if (process.env.DATABASE_URL) {
  process.env.DATABASE_DATABASE_URL = process.env.DATABASE_URL;
}

const {
  PrismaClient,
  IssuePriority,
  IssueStatus,
  ClientRole,
  GlobalRole,
  CrawlState
} = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo data for tasks...');

  const clerkUserId = process.env.DEMO_CLERK_USER_ID || 'user_demo';
  const clientName = 'Atlas Demo Site';
  const clientUrl = 'https://www.example.com';

  // Create or update a demo client + user + membership so the UI has access.
  const [client] = await Promise.all([
    prisma.client.upsert({
      where: { id: 1 },
      update: { name: clientName, url: clientUrl },
      create: { name: clientName, url: clientUrl }
    }),
    prisma.user.upsert({
      where: { clerkUserId: clerkUserId },
      update: { globalRole: GlobalRole.INTERNAL_ADMIN },
      create: {
        clerkUserId: clerkUserId,
        globalRole: GlobalRole.INTERNAL_ADMIN
      }
    })
  ]);

  await prisma.clientMembership.upsert({
    where: { clientId_clerkUserId: { clientId: client.id, clerkUserId } },
    update: { role: ClientRole.INTERNAL_ADMIN },
    create: {
      clientId: client.id,
      clerkUserId,
      role: ClientRole.INTERNAL_ADMIN
    }
  });

  // Clear previous demo crawl/audit/issues for this client so re-runs stay tidy.
  await prisma.auditIssue.deleteMany({ where: { clientId: client.id } });
  await prisma.audit.deleteMany({ where: { clientId: client.id } });
  await prisma.urls.deleteMany({ where: { clientId: client.id } });
  await prisma.crawl.deleteMany({ where: { clientId: client.id } });

  const crawl = await prisma.crawl.create({
    data: {
      clientId: client.id,
      url: clientUrl,
      state: CrawlState.COMPLETED
    }
  });

  const audit = await prisma.audit.create({
    data: {
      crawlId: crawl.id,
      clientId: client.id,
      score: 78,
      pages_missing_title: 2,
      too_short_title: 1,
      pages_missing_description: 1,
      pages_missing_h1: 3,
      pages_200_response: 12,
      pages_3xx_response: 1,
      pages_4xx_response: 0,
      pages_5xx_response: 0
    }
  });

  const now = new Date();
  const lastWeek = new Date(now);
  lastWeek.setDate(now.getDate() - 7);

  const urls = await Promise.all([
    prisma.urls.create({
      data: {
        clientId: client.id,
        crawlId: crawl.id,
        url: `${clientUrl}/`,
        status: 200,
        metaTitle: 'Home',
        metaDescription: 'Demo home page',
        h1: ['Welcome to the demo'],
        h2: [],
        h3: [],
        h4: [],
        h5: [],
        h6: []
      }
    }),
    prisma.urls.create({
      data: {
        clientId: client.id,
        crawlId: crawl.id,
        url: `${clientUrl}/pricing`,
        status: 200,
        metaTitle: 'Pricing',
        metaDescription: 'Plans and pricing',
        h1: ['Pricing plans'],
        h2: [],
        h3: [],
        h4: [],
        h5: [],
        h6: []
      }
    }),
    prisma.urls.create({
      data: {
        clientId: client.id,
        crawlId: crawl.id,
        url: `${clientUrl}/blog/technical-seo`,
        status: 200,
        metaTitle: 'Technical SEO',
        metaDescription: 'Technical SEO guide',
        h1: ['Technical SEO checklist'],
        h2: [],
        h3: [],
        h4: [],
        h5: [],
        h6: []
      }
    }),
    prisma.urls.create({
      data: {
        clientId: client.id,
        crawlId: crawl.id,
        url: `${clientUrl}/contact`,
        status: 404,
        metaTitle: null,
        metaDescription: null,
        h1: [],
        h2: [],
        h3: [],
        h4: [],
        h5: [],
        h6: []
      }
    })
  ]);

  const [home, pricing, blog, contact] = urls;

  const issues = [
    {
      issueKey: 'missing_title',
      urlId: contact.id,
      priority: IssuePriority.CRITICAL,
      status: IssueStatus.OPEN,
      metadata: { hint: 'Add a unique title tag', page: contact.url },
      createdAt: now
    },
    {
      issueKey: 'missing_meta_description',
      urlId: contact.id,
      priority: IssuePriority.HIGH,
      status: IssueStatus.IN_PROGRESS,
      metadata: { hint: 'Add a concise meta description', page: contact.url },
      createdAt: now
    },
    {
      issueKey: 'duplicate_h1',
      urlId: home.id,
      priority: IssuePriority.MEDIUM,
      status: IssueStatus.FIXED,
      metadata: { hint: 'Use one H1 per page', page: home.url },
      fixedAt: now
    },
    {
      issueKey: 'slow_page',
      urlId: pricing.id,
      priority: IssuePriority.LOW,
      status: IssueStatus.OPEN,
      metadata: { hint: 'Compress hero image', page: pricing.url },
      createdAt: lastWeek
    },
    {
      issueKey: 'broken_internal_link',
      urlId: blog.id,
      priority: IssuePriority.HIGH,
      status: IssueStatus.IGNORED,
      metadata: { hint: 'Ignore non-critical link', page: blog.url },
      ignoredAt: now
    },
    {
      issueKey: 'missing_h1',
      urlId: blog.id,
      priority: IssuePriority.CRITICAL,
      status: IssueStatus.OPEN,
      metadata: { hint: 'Add a descriptive H1', page: blog.url },
      createdAt: now
    }
  ];

  for (const issue of issues) {
    await prisma.auditIssue.create({
      data: {
        clientId: client.id,
        auditId: audit.id,
        urlId: issue.urlId,
        issueKey: issue.issueKey,
        metadata: issue.metadata,
        priority: issue.priority,
        status: issue.status,
        fixedAt: issue.fixedAt ?? null,
        ignoredAt: issue.ignoredAt ?? null,
        createdAt: issue.createdAt ?? now
      }
    });
  }

  console.log('Seed complete. Created client:', client.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

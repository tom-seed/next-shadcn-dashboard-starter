import { Spider } from '@spider-cloud/spider-client';

import { JSDOM } from 'jsdom';
import { PrismaClient } from '@prisma/client';
import { runAudits } from './audits';

const prisma = new PrismaClient();

// Define the crawl parameters with proper types
const crawlParams = {
  limit: 0,
  proxy_enabled: true,
  store_data: false,
  metadata: true,
  request: 'smart' as const, // Use const assertion for literal type
  sitemap: true,
  full_resources: false,
  return_page_links: true,
  return_headers: true,
  concurrency_limit: 1,
  return_format: 'raw' as const, // Use const assertion
  readability: true,
  external_domains: [],
  root_selector: 'body',
  subdomains: false,
  tld: false,
  fingerprint: true,
  anti_bot: true,
  stealth: true
};

export async function runCrawl(clientId: number, url: string): Promise<string> {
  const SPIDER_API_KEY = process.env.SPIDER_API_KEY;
  if (!SPIDER_API_KEY) throw new Error('SPIDER_API_KEY is not set');

  const spider = new Spider({ apiKey: SPIDER_API_KEY });
  const crawl = await prisma.crawl.create({ data: { clientId, url } });

  const baseDomain = new URL(url).hostname.replace('www.', '');
  const isInternal = (link: string) => {
    try {
      const parsed = new URL(link, url); // Resolve relative links using base
      return parsed.hostname.endsWith(baseDomain);
    } catch {
      return false; // Skip invalid URLs
    }
  };

  const stats: Record<string, number> = {};
  let pageCount = 0;

  //console.log(`🕷️ Starting crawl for: ${url}`);

  await spider.crawlUrl(url, crawlParams, true, async (page: any) => {
    //console.log(`🧱 Page received from Spider:`, page);
    pageCount++;
    //console.log(`🔍 Processing page #${pageCount}: ${page.url}`);

    const html = page.content || page.html;
    if (!html) {
      console.warn(`⚠️ No HTML found for page: ${page.url}`);
      return;
    }

    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const extractHeadings = (level: number): string[] =>
      Array.from(doc.querySelectorAll(`h${level}`)).map(
        (el) => el.textContent?.trim() || ''
      );

    const hTags: Record<string, string[]> = {};
    for (let i = 1; i <= 6; i++) {
      hTags[`h${i}`] = extractHeadings(i);
    }

    const meta = page.metadata || {};
    const links: string[] = page.links || [];
    const linkData = page.link_data || {};

    const internalLinks = links.filter((link: string) => isInternal(link));
    const externalLinks = links.filter((link: string) => !isInternal(link));

    const internalLinkStatuses = Object.fromEntries(
      internalLinks.map((link: string) => [
        link,
        linkData[link]?.status || null
      ])
    );

    const canonical = meta.canonical || meta.original_url || page.url;
    const isSelf = canonical === page.url;
    const isCanonicalised = canonical !== page.url;

    const auditStats = runAudits({
      title: meta.title,
      description: meta.description,
      headings: hTags,
      statusCode: page.status
    });

    //console.log(`📄 Audit for ${page.url}:`, auditStats);

    for (const [key, val] of Object.entries(auditStats)) {
      stats[key] = (stats[key] || 0) + (typeof val === 'number' ? val : 0);
    }

    await prisma.urls.create({
      data: {
        clientId,
        crawlId: crawl.id,
        url: page.url ?? '',
        status: page.status,
        originalStatus: page.headers?.[':status'] || null,
        redirectTarget: page.headers?.location || null,
        canonical,
        canonicalStatus: linkData[canonical]?.status || null,
        isSelfReferencingCanonical: isSelf,
        isCanonicalised,
        metaTitle: meta.title,
        metaDescription: meta.description,
        internalLinks,
        externalLinks,
        internalLinkStatuses,
        ...hTags
      }
    });
  });

  //console.log(`✅ Finished crawl. Pages crawled: ${pageCount}`);
  //console.log(`📊 Final stats:`, stats);

  await prisma.audit.create({
    data: {
      clientId,
      crawlId: crawl.id,
      ...stats
    }
  });

  return `Crawled ${url} and saved ${Object.keys(stats).length} audit metrics`;
}

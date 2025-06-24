import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { load } from 'cheerio';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const crawlId = Number(searchParams.get('crawlId'));
  const clientId = Number(searchParams.get('clientId'));

  const payload = await req.json();

  if (!payload?.content || !payload.page_url) {
    return NextResponse.json(
      { success: false, error: 'Missing content or URL' },
      { status: 400 }
    );
  }

  const $ = load(payload.content);

  const getHeadings = (tag: string) =>
    $(tag)
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean);

  const h1 = getHeadings('h1');
  const h2 = getHeadings('h2');
  const h3 = getHeadings('h3');
  const h4 = getHeadings('h4');
  const h5 = getHeadings('h5');
  const h6 = getHeadings('h6');

  const metaTitle = $('title').text() || payload.title || null;
  const metaDescription =
    $('meta[name="description"]').attr('content') ||
    payload.description ||
    null;
  const canonical = $('link[rel="canonical"]').attr('href') || null;

  const internalLinks = $(
    'a[href^="/"], a[href^="https://' + payload.domain + '"]'
  )
    .map((_, el) => $(el).attr('href'))
    .get()
    .filter(Boolean);

  const externalLinks = $('a[href^="http"]')
    .map((_, el) => $(el).attr('href'))
    .get()
    .filter((href) => !href.includes(payload.domain));

  await prisma.urls.create({
    data: {
      clientId,
      crawlId,
      url: payload.page_url,
      status: payload.status_code || null,
      originalStatus: payload.original_status || null,
      canonical,
      metaTitle,
      metaDescription,
      h1,
      h2,
      h3,
      h4,
      h5,
      h6,
      internalLinks,
      externalLinks,
      internalLinkStatuses: {} // Placeholder; update if you have link status logic
    }
  });

  return NextResponse.json({ success: true });
}

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { load } from 'cheerio';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const crawlId = Number(searchParams.get('crawlId'));
    const clientId = Number(searchParams.get('clientId'));

    if (!crawlId || !clientId) {
      console.warn('Missing crawlId or clientId');
      return NextResponse.json({ success: true, ignored: true });
    }

    const payload = await req.json();

    if (!payload?.content || !payload.page_url) {
      console.warn('Missing content or page_url');
      return NextResponse.json({ success: true, ignored: true });
    }

    const $ = load(payload.content);

    const extract = (tag: string) =>
      $(tag)
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(Boolean);

    const data = {
      clientId,
      crawlId,
      url: payload.page_url,
      status: payload.status_code || null,
      originalStatus: payload.original_status || null,
      canonical: $('link[rel="canonical"]').attr('href') || null,
      metaTitle: $('title').text() || payload.title || null,
      metaDescription:
        $('meta[name="description"]').attr('content') ||
        payload.description ||
        null,
      h1: extract('h1'),
      h2: extract('h2'),
      h3: extract('h3'),
      h4: extract('h4'),
      h5: extract('h5'),
      h6: extract('h6'),
      internalLinks: $(`a[href^="/"], a[href^="https://${payload.domain}"]`)
        .map((_, el) => $(el).attr('href'))
        .get()
        .filter(Boolean),
      externalLinks: $('a[href^="http"]')
        .map((_, el) => $(el).attr('href'))
        .get()
        .filter((href) => !href.includes(payload.domain)),
      internalLinkStatuses: {}
    };

    await prisma.urls.create({ data });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Webhook failed:', err);
    return NextResponse.json({ success: true, ignored: true });
  }
}

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { name, url } = await req.json();

    const client = await prisma.client.create({ data: { name, url } });

    const crawl = await prisma.crawl.create({
      data: { clientId: client.id, url }
    });

    const spiderPayload = {
      url,
      webhooks: {
        destination: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/spider?crawlId=${crawl.id}&clientId=${client.id}`,
        on_website_status: true
      },
      request: 'basic', // simplified for debugging
      full_resources: false, // avoids JS rendering overhead
      sitemap: true,
      store_data: true,
      return_format: 'json',
      return_page_links: true,
      limit: 0
    };

    const spiderRes = await fetch('https://api.spider.cloud/crawl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SPIDER_API_KEY}`
      },
      body: JSON.stringify(spiderPayload)
    });

    if (!spiderRes.ok) {
      const errorText = await spiderRes.text();
      return NextResponse.json(
        { success: false, error: errorText },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      redirectUrl: `/dashboard/${client.id}/overview`,
      clientId: client.id
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      select: { id: true, name: true }
    });
    return NextResponse.json(clients);
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to load clients' },
      { status: 500 }
    );
  }
}

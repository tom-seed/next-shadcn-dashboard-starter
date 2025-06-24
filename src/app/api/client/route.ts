import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { name, url } = await req.json();

    console.log('📨 Incoming client creation:', { name, url });

    const client = await prisma.client.create({ data: { name, url } });

    const crawl = await prisma.crawl.create({
      data: { clientId: client.id, url }
    });

    const spiderPayload = {
      url,
      webhooks: {
        destination: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/spider?crawlId=${crawl.id}&clientId=${client.id}`,
        on_find_metadata: true
      },
      limit: 0,
      proxy_enabled: true,
      store_data: true,
      metadata: true,
      request: 'smart',
      sitemap: true,
      full_resources: true, // ✅ MUST be true to allow JS rendering
      return_page_links: true,
      return_headers: true,
      return_json_data: true,
      readability: true,
      concurrency_limit: 1,
      return_format: 'json',
      external_domains: [],
      root_selector: 'body',
      subdomains: true,
      tld: false,
      fingerprint: true,
      anti_bot: true,
      stealth: true,
      redirect_policy: 'loose'
    };

    console.log('🌐 Creating Spider crawl with:', spiderPayload);

    const spiderRes = await fetch('https://api.spider.cloud/crawl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SPIDER_API_KEY}`
      },
      body: JSON.stringify(spiderPayload)
    });

    const spiderText = await spiderRes.text();
    console.log('🪲 Spider response:', spiderRes.status, spiderText);

    if (!spiderRes.ok) {
      return NextResponse.json(
        { success: false, error: spiderText },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      redirectUrl: `/dashboard/${client.id}/overview`,
      clientId: client.id
    });
  } catch (error) {
    console.error('❌ Error in POST /api/client:', error);
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
    console.error('❌ Error in GET /api/client:', err);
    return NextResponse.json(
      { error: 'Failed to load clients' },
      { status: 500 }
    );
  }
}

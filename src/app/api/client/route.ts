import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { name, url, cron } = await req.json();

    // 1. Create the client
    const client = await prisma.client.create({
      data: { name, url, cron }
    });

    // 2. Prepare Spider API body
    const spiderPayload = {
      url: url,
      cron: cron || 'once',
      webhooks: {
        destination:
          'https://next-shadcn-dashboard-starter-liart.vercel.app/api/webhook/spider',
        on_credits_depleted: true,
        on_credits_half_depleted: true,
        on_website_status: true,
        on_find: true,
        on_find_metadata: true
      },
      limit: 0,
      proxy_enabled: true,
      store_data: true,
      metadata: true,
      request: 'smart',
      sitemap: true,
      full_resources: false,
      return_page_links: true,
      return_headers: true,
      concurrency_limit: 1,
      return_format: 'raw',
      external_domains: [],
      root_selector: 'body',
      subdomains: true,
      tld: false,
      fingerprint: true,
      anti_bot: true,
      stealth: true,
      redirect_policy: 'loose'
    };

    console.log('🕷️ Triggering Spider.cloud crawl with payload:');
    console.dir(spiderPayload, { depth: null });

    // 3. Send to Spider.cloud
    const spiderRes = await fetch('https://api.spider.cloud/crawl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SPIDER_API_KEY}`
      },
      body: JSON.stringify(spiderPayload)
    });

    console.log(
      '📦 JSON payload being sent:',
      JSON.stringify(spiderPayload, null, 2)
    );

    if (!spiderRes.ok) {
      const errorText = await spiderRes.text();
      console.error('❌ Spider.cloud responded with error:', errorText);
      return NextResponse.json(
        { success: false, error: 'Failed to trigger crawl', detail: errorText },
        { status: 500 }
      );
    }

    const spiderData = await spiderRes.json();
    console.log('✅ Spider.cloud response:', spiderData);

    return NextResponse.json({
      success: true,
      message: 'Crawl triggered',
      clientId: client.id,
      spiderId: spiderData?.id
    });
  } catch (error) {
    console.error('🔥 Unexpected error in client POST route:', error);
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

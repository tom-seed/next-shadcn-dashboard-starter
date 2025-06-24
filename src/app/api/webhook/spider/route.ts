import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

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

    const url = payload?.page_url || null;
    const status = payload?.status_code || null;

    if (!url) {
      console.warn('Missing page_url in payload');
      return NextResponse.json({ success: true, ignored: true });
    }

    console.log(`📄 Page crawled: ${url} (Status: ${status})`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ Webhook error:', err);
    return NextResponse.json({ success: true, ignored: true });
  }
}

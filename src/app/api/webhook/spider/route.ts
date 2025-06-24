import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const crawlId = Number(searchParams.get('crawlId'));
    const clientId = Number(searchParams.get('clientId'));

    if (!crawlId || !clientId) {
      console.warn('❗ Missing crawlId or clientId in webhook URL params:', {
        crawlId,
        clientId
      });
      return NextResponse.json({ success: false, ignored: true });
    }

    const payload = await req.json();

    console.log(
      '📦 Received Spider webhook payload:',
      JSON.stringify(payload, null, 2)
    );

    const url = payload?.page_url;
    const status = payload?.status_code;

    if (!url) {
      console.warn('⚠️ Missing page_url in payload:', payload);
      return NextResponse.json({ success: false, ignored: true });
    }

    console.log(`✅ Page received: ${url} (Status: ${status})`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ Error handling Spider webhook:', err);
    return NextResponse.json(
      { success: false, error: 'Webhook error' },
      { status: 500 }
    );
  }
}

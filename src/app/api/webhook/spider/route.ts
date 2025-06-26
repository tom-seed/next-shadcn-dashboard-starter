import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const crawlId = Number(searchParams.get('crawlId'));
    const clientId = Number(searchParams.get('clientId'));

    if (!crawlId || !clientId) {
      return NextResponse.json({ success: false, ignored: true });
    }

    const payload = await req.json();

    const url = payload?.page_url;
    const status = payload?.status_code;

    if (!url) {
      return NextResponse.json({ success: false, ignored: true });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Webhook error' },
      { status: 500 }
    );
  }
}

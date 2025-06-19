import { NextResponse } from 'next/server';
import { runCrawl } from '@/lib/crawler';

export async function POST(req: Request) {
  const { clientId, url } = await req.json();
  try {
    const result = await runCrawl(clientId, url);
    return NextResponse.json({ success: true, message: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

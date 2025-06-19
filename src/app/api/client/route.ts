import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { runCrawl } from '@/lib/crawler';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { name, url } = await req.json();

    // 1. Create the client
    const client = await prisma.client.create({
      data: { name, url }
    });

    // 2. Trigger the crawl
    const message = await runCrawl(client.id, url);

    return NextResponse.json({ success: true, message, clientId: client.id });
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

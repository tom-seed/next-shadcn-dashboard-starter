import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const id = parseInt(clientId);

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
  }

  try {
    const latestCrawls = await prisma.crawl.findMany({
      where: { clientId: id },
      orderBy: { createdAt: 'desc' },
      take: 2,
      include: { audit: true }
    });

    const [latest, previous] = latestCrawls;

    if (!latest?.audit) {
      return NextResponse.json(
        { error: 'No audit data found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      latest: latest.audit,
      previous: previous?.audit ?? null
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch audit data' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string; urlId: string }> }
) {
  const { clientId, urlId } = await params;

  const clientIdInt = parseInt(clientId);
  const urlIdInt = parseInt(urlId);

  if (isNaN(clientIdInt) || isNaN(urlIdInt)) {
    return NextResponse.json(
      { error: 'Invalid clientId or urlId' },
      { status: 400 }
    );
  }

  try {
    const url = await prisma.urls.findFirst({
      where: {
        id: urlIdInt,
        clientId: clientIdInt
      }
    });

    if (!url) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 });
    }

    return NextResponse.json(url);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 500 });
  }
}

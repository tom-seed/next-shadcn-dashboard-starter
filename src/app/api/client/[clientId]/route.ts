import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient().$extends(withAccelerate());

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const id = parseInt(clientId);

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
  }

  const client = await prisma.client.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      url: true // ✅ This line is critical
    },
    cacheStrategy: { ttl: 3600 * 24, swr: 3600 * 24 * 3 }
  });

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  return NextResponse.json(client);
}

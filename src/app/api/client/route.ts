import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

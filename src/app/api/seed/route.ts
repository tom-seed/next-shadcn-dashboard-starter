import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  await prisma.client.create({
    data: {
      name: 'Example Client',
      url: 'https://example.com'
    }
  });

  return NextResponse.json({ message: 'Database seeded successfully' });
}

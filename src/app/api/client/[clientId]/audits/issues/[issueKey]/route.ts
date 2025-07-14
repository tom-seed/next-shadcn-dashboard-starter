// FILE: src/app/api/client/[clientId]/audits/issues/[issueKey]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient().$extends(withAccelerate());

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string; issueKey: string }> }
) {
  const { clientId, issueKey: rawIssueKey } = await params;
  const issueKey = rawIssueKey.replaceAll('-', '_');

  const id = parseInt(clientId);

  const defaultResponse = {
    urls: [],
    totalCount: 0,
    page: 1,
    perPage: 10
  };

  if (isNaN(id)) {
    return NextResponse.json(
      { ...defaultResponse, error: 'Invalid client ID' },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = Math.min(parseInt(searchParams.get('perPage') || '10'), 50);
  const skip = (page - 1) * perPage;

  try {
    const audit = await prisma.audit.findFirst({
      where: { clientId: id },
      orderBy: { createdAt: 'desc' },
      cacheStrategy: { ttl: 3600 * 24, swr: 3600 * 24 * 3 }
    });

    if (!audit) {
      return NextResponse.json(
        { ...defaultResponse, error: 'Audit not found' },
        { status: 404 }
      );
    }

    const allUrls = (audit as any)[issueKey] || [];

    if (!Array.isArray(allUrls)) {
      return NextResponse.json(
        { ...defaultResponse, error: 'Invalid data format for issueKey' },
        { status: 500 }
      );
    }

    const paginatedUrls = allUrls.slice(skip, skip + perPage);

    return NextResponse.json({
      urls: paginatedUrls,
      totalCount: allUrls.length,
      page,
      perPage
    });
  } catch (err) {
    return NextResponse.json(
      { ...defaultResponse, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient().$extends(withAccelerate());

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string; issueKey: string }> }
) {
  const { clientId, issueKey: rawIssueKey } = await params;
  const issueKey = rawIssueKey.replaceAll('-', '_'); // match your DB schema

  const defaultResponse = {
    urls: [],
    totalCount: 0,
    page: 1,
    perPage: 10
  };

  const id = parseInt(clientId);
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

    const [issues, totalCount] = await Promise.all([
      prisma.auditIssue.findMany({
        where: {
          auditId: audit.id,
          issueKey
        },
        include: {
          url: true // join with URL for actual `url.url` string
        },
        skip,
        take: perPage
      }),
      prisma.auditIssue.count({
        where: {
          auditId: audit.id,
          issueKey
        }
      })
    ]);

    const formattedIssues = issues.map((issue) => ({
      id: issue.id,
      url: issue.url?.url ?? '(URL missing)'
    }));

    return NextResponse.json({
      issues: formattedIssues,
      totalCount,
      page,
      perPage
    });
  } catch (err) {
    console.error('❌ API error:', err);
    return NextResponse.json(
      { ...defaultResponse, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

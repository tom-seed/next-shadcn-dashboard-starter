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
    issues: [],
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
  const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
  const perPageParam = searchParams.get('perPage') || '10';
  const parsedPerPage = parseInt(perPageParam);
  const perPage =
    Number.isNaN(parsedPerPage) || parsedPerPage <= 0
      ? null
      : Math.min(parsedPerPage, 100000);
  const paginationArgs =
    perPage === null
      ? undefined
      : ({
          skip: (page - 1) * perPage,
          take: perPage
        } as const);

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

    let issues: {
      id: number;
      url: { id: number; url: string } | null;
      metadata?: any;
    }[] = [];
    let totalCount = 0;

    // Special handling for Status Code aggregates
    if (
      [
        'pages_3xx_response',
        'pages_4xx_response',
        'pages_5xx_response'
      ].includes(issueKey)
    ) {
      const statusRangeStart = parseInt(issueKey.split('_')[1][0]) * 100;
      const statusRangeEnd = statusRangeStart + 99;

      const [urlData, count] = await Promise.all([
        prisma.urls.findMany({
          where: {
            clientId: id,
            crawlId: audit.crawlId,
            status: {
              gte: statusRangeStart,
              lte: statusRangeEnd
            }
          },
          select: { id: true, url: true },
          ...(paginationArgs ?? {})
        }),
        prisma.urls.count({
          where: {
            clientId: id,
            crawlId: audit.crawlId,
            status: {
              gte: statusRangeStart,
              lte: statusRangeEnd
            }
          }
        })
      ]);

      issues = urlData.map((u) => ({ id: u.id, url: u })); // Map to match expected structure
      totalCount = count;
    }
    // Special handling for Image Audits
    else if (
      issueKey.startsWith('total_images_') ||
      issueKey.startsWith('pages_with_images_')
    ) {
      // Determine filter based on issueKey
      let imageWhere: any = {
        clientId: id,
        crawlId: audit.crawlId
      };

      if (issueKey === 'total_images_missing_alt') {
        imageWhere.hasAlt = false;
      } else if (issueKey === 'total_images_empty_alt') {
        // Assuming empty alt means alt is present but empty string, or handled by hasAlt logic depending on seed
        // Based on schema, hasAlt is boolean. Let's check if we need more specific logic.
        // For now, let's assume 'hasAlt: false' covers missing.
        // If 'empty' is distinct, it might be alt === "".
        // Let's look at how seed sets it.
        // If the user sees "Images with Empty Alt Text", it implies a distinction.
        // Let's try to filter by alt === "".
        imageWhere.alt = '';
      } else if (issueKey === 'total_images_missing_dimensions') {
        imageWhere.hasDimensions = false;
      } else if (issueKey === 'total_images_unoptimized_format') {
        imageWhere.isOptimizedFormat = false;
      }

      // If it's a "pages_with..." key, we need to find unique URLs that have these images.
      // But the current UI expects a list of items.
      // If the key is "total_images...", we list images (and their source URL).
      // If the key is "pages_with...", we list URLs.

      if (issueKey.startsWith('total_images_')) {
        const [imageData, count] = await Promise.all([
          prisma.image.findMany({
            where: imageWhere,
            include: { url: { select: { id: true, url: true } } },
            ...(paginationArgs ?? {})
          }),
          prisma.image.count({ where: imageWhere })
        ]);
        issues = imageData.map((img) => ({ id: img.id, url: img.url }));
        totalCount = count;
      } else {
        // pages_with_images_...
        // We need to find Urls that have at least one image matching the criteria.
        // This is a bit more complex with Prisma.
        // We can use `where: { images: { some: ... } }` on Urls model.

        let urlImageCriteria: any = {};
        if (issueKey === 'pages_with_images_missing_alt')
          urlImageCriteria.hasAlt = false;
        else if (issueKey === 'pages_with_images_empty_alt')
          urlImageCriteria.alt = '';
        else if (issueKey === 'pages_with_images_missing_dimensions')
          urlImageCriteria.hasDimensions = false;
        else if (issueKey === 'pages_with_unoptimized_image_format')
          urlImageCriteria.isOptimizedFormat = false;

        const [urlData, count] = await Promise.all([
          prisma.urls.findMany({
            where: {
              clientId: id,
              crawlId: audit.crawlId,
              images: {
                some: urlImageCriteria
              }
            },
            select: { id: true, url: true },
            ...(paginationArgs ?? {})
          }),
          prisma.urls.count({
            where: {
              clientId: id,
              crawlId: audit.crawlId,
              images: {
                some: urlImageCriteria
              }
            }
          })
        ]);
        issues = urlData.map((u) => ({ id: u.id, url: u }));
        totalCount = count;
      }
    } else {
      // Default behavior for standard audit issues
      const [auditIssues, count] = await Promise.all([
        prisma.auditIssue.findMany({
          where: {
            auditId: audit.id,
            issueKey
          },
          include: {
            url: { select: { id: true, url: true } }
          },
          ...(paginationArgs ?? {})
        }),
        prisma.auditIssue.count({
          where: {
            auditId: audit.id,
            issueKey
          }
        })
      ]);
      issues = auditIssues.map((i) => ({ ...i, metadata: i.metadata }));
      totalCount = count;
    }

    const formattedIssues = issues.map((issue) => ({
      id: issue.id,
      urlId: issue.url?.id ?? null,
      url: issue.url?.url ?? '(URL missing)',
      metadata: issue.metadata ?? null,
      // @ts-ignore - these fields exist on AuditIssue but not on the mapped Url/Image objects
      status: issue.status ?? 'OPEN',
      // @ts-ignore
      priority: issue.priority ?? 'MEDIUM',
      // @ts-ignore
      fixedAt: issue.fixedAt ?? null,
      // @ts-ignore
      ignoredAt: issue.ignoredAt ?? null
    }));

    return NextResponse.json({
      issues: formattedIssues,
      totalCount,
      page,
      perPage: perPage ?? totalCount
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ...defaultResponse, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string; issueKey: string }> }
) {
  const { clientId, issueKey: rawIssueKey } = await params;
  const issueKey = rawIssueKey.replaceAll('-', '_');

  // Virtual issues cannot be updated via AuditIssue table
  if (
    ['pages_3xx_response', 'pages_4xx_response', 'pages_5xx_response'].includes(
      issueKey
    ) ||
    issueKey.startsWith('total_images_') ||
    issueKey.startsWith('pages_with_images_')
  ) {
    return NextResponse.json(
      { error: 'Cannot update status for this issue type' },
      { status: 400 }
    );
  }

  const id = parseInt(clientId);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { status, priority } = body;

    const audit = await prisma.audit.findFirst({
      where: { clientId: id },
      orderBy: { createdAt: 'desc' }
    });

    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;

    if (status === 'FIXED') {
      updateData.fixedAt = new Date();
    } else if (status === 'IGNORED') {
      updateData.ignoredAt = new Date();
    } else if (status === 'OPEN' || status === 'IN_PROGRESS') {
      updateData.fixedAt = null;
      updateData.ignoredAt = null;
    }

    const result = await prisma.auditIssue.updateMany({
      where: {
        auditId: audit.id,
        issueKey
      },
      data: updateData
    });

    return NextResponse.json({ count: result.count });
  } catch (err) {
    console.error('Error updating issues:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

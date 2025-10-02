import { Urls } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PaginatedUrlsResponse {
  urls: Urls[];
  totalCount: number;
  page: number;
  perPage: number;
}

// Used to shape individual URL detail
interface InternalLinkDetail {
  id: number;
  status: number | null;
  targetUrl: string;
  target: {
    id: number;
    url: string;
    status: number | null;
  } | null;
}

interface ReferrerLinkDetail {
  id: number;
  status: number | null;
  source: {
    id: number;
    url: string;
    status: number | null;
  };
}

interface AuditIssue {
  id: number;
  issueKey: string;
  auditId: number;
  urlId: number;
  clientId: number;
  createdAt: Date; // ✅ was `string` before — must be Date to match Prisma
}

export interface ExtendedUrl extends Urls {
  sourceLinks: InternalLinkDetail[];
  targetLinks: ReferrerLinkDetail[];
  auditIssues: AuditIssue[];
}

// Fetch paginated list
export async function getUrls(
  clientId: string,
  page: number = 1,
  perPage: number = 10,
  search: string = '',
  status: string = ''
): Promise<PaginatedUrlsResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const query = new URLSearchParams();

  query.append('page', page.toString());
  query.append('perPage', perPage.toString());
  if (search) query.append('name', search);
  if (status) query.append('status', status);

  const res = await fetch(
    `${baseUrl}/api/clients/${clientId}/urls?${query.toString()}`,
    {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' }
    }
  );

  if (!res.ok) {
    const errorData = await res
      .json()
      .catch(() => ({ message: 'Unknown API error' }));
    console.error('API Fetch Error:', errorData);
    throw new Error(
      `Failed to fetch URLs: ${errorData.error || res.statusText}`
    );
  }

  let data: PaginatedUrlsResponse = await res.json();

  if (
    Array.isArray(data) &&
    data.length > 0 &&
    typeof data[0] === 'object' &&
    'url' in data[0]
  ) {
    console.warn(`[API_RESPONSE_ERROR] Expected object, received array:`, data);
    data = {
      urls: data as unknown as Urls[],
      totalCount: data.length,
      page,
      perPage
    };
  } else {
    if (!Array.isArray(data.urls)) {
      console.warn(`[API_RESPONSE_ERROR] urls is not an array:`, data.urls);
      data.urls = [];
    }
    if (typeof data.totalCount !== 'number') {
      console.warn(
        `[API_RESPONSE_ERROR] totalCount is not a number:`,
        data.totalCount
      );
      data.totalCount = 0;
    }
  }

  return data;
}

// Fetch single URL by ID
export async function getUrlById(
  clientId: string | number | undefined,
  urlId: string | number | undefined
): Promise<ExtendedUrl | null> {
  const clientIdNum = Number(clientId);
  const urlIdNum = Number(urlId);

  // Bail early if params are not valid (e.g., during Next prefetch)
  if (!Number.isFinite(clientIdNum) || !Number.isFinite(urlIdNum)) {
    return null;
  }

  const url = await prisma.urls.findFirst({
    where: {
      id: urlIdNum,
      clientId: clientIdNum
    },
    include: {
      auditIssues: true,
      sourceLinks: {
        include: {
          target: true
        }
      },
      targetLinks: {
        include: {
          source: true
        }
      }
    }
  });

  return url as ExtendedUrl | null;
}

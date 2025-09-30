import { cache } from 'react';
import 'server-only';
import { getBackendAuthHeaders } from '@/lib/auth';

export type CrawlState = 'STARTED' | 'ABORTED' | 'COMPLETED';

export interface Client {
  id: number;
  name: string;
  url?: string | null;
  cron?: string | null;
  clerkOrganizationId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Crawl {
  id: number;
  clientId: number;
  state: CrawlState;
  url: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

const backendUrl =
  process.env.ATLAS_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

/**
 * Fetches data from the backend API with authentication headers.
 * Falls back to provided fallback value if backend is unavailable.
 */
async function backendFetch<T>(
  path: string,
  init?: RequestInit,
  fallback?: T
): Promise<T> {
  if (!backendUrl) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error('Backend URL is not configured.');
  }

  const authHeaders = await getBackendAuthHeaders();

  try {
    const response = await fetch(`${backendUrl}${path}`, {
      ...init,
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(init?.headers ?? {})
      } as HeadersInit
    });

    if (!response.ok) {
      if (fallback !== undefined) {
        // eslint-disable-next-line no-console
        console.warn(`Backend request failed for ${path}, using fallback`);
        return fallback;
      }
      const text = await response.text();
      throw new Error(
        `Backend request failed for ${path}: ${response.status} ${text}`
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (fallback !== undefined) {
      // eslint-disable-next-line no-console
      console.warn(`Backend request error for ${path}, using fallback:`, error);
      return fallback;
    }
    throw error;
  }
}

/**
 * Lists all clients accessible to the current user.
 * Cached for performance.
 */
export const listClients = cache(async (): Promise<Client[]> => {
  return backendFetch<Client[]>('/clients', undefined, []);
});

/**
 * Gets a specific client by ID.
 */
export async function getClient(
  clientId: number | string
): Promise<Client | undefined> {
  return backendFetch<Client | undefined>(
    `/clients/${clientId}`,
    undefined,
    undefined
  );
}

/**
 * Lists all crawls for a specific client.
 */
export async function listClientCrawls(
  clientId: number | string
): Promise<Crawl[]> {
  return backendFetch<Crawl[]>(`/clients/${clientId}/crawls`, undefined, []);
}

/**
 * Gets the latest crawl for a specific client.
 */
export async function getLatestCrawl(
  clientId: number | string
): Promise<Crawl | undefined> {
  const crawls = await listClientCrawls(clientId);
  return crawls[0]; // Assuming backend returns sorted by date desc
}

/**
 * Triggers a new crawl for a client.
 */
export async function triggerCrawl(payload: {
  clientId: number | string;
  url: string;
}): Promise<{ success: boolean; message?: string }> {
  return backendFetch<{ success: boolean; message?: string }>(
    '/start-crawl',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    { success: false, message: 'Backend unavailable' }
  );
}

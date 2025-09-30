'use client';

import type { ClientRole } from '@prisma/client';

/**
 * Handles API response and throws on error.
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body?.error ?? response.statusText;
    throw new Error(message || 'Unexpected error');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/**
 * Creates a new client with optional crawl trigger.
 */
export async function createClientAction(payload: {
  name: string;
  url: string;
  startCrawl?: boolean;
  cron?: string;
}): Promise<{ clientId: number; redirectUrl: string }> {
  const response = await fetch('/api/create-client', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return handleResponse(response);
}

/**
 * Invites a user to a client organization with a specified role.
 */
export async function inviteUserAction(payload: {
  clientId: number | string;
  email: string;
  role: Extract<ClientRole, 'CLIENT_ADMIN' | 'CLIENT_VIEWER'>;
}): Promise<{ ok: boolean }> {
  const response = await fetch('/api/invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return handleResponse(response);
}

/**
 * Schedules or updates a crawl schedule for a client.
 */
export async function scheduleCrawlAction(payload: {
  clientId: number | string;
  cron: string;
  enabled: boolean;
}): Promise<{ ok: boolean }> {
  const response = await fetch('/api/schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return handleResponse(response);
}

/**
 * Triggers a manual crawl for a client.
 */
export async function triggerCrawlAction(payload: {
  clientId: number | string;
  url: string;
}): Promise<{ success: boolean; message?: string }> {
  const response = await fetch('/api/trigger-crawl', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return handleResponse(response);
}

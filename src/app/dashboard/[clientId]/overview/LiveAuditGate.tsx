// src/app/dashboard/[clientId]/overview/LiveAuditGate.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  clientId: number;
  /** Pass only the latest audit id to avoid Date/string type mismatches */
  initialLatestId?: number | null;
};

/**
 * Listens for audit completion (SSE + polling fallback).
 * When a newer audit appears, it calls router.refresh() to re-render the server page.
 */
export default function LiveAuditGate({
  clientId,
  initialLatestId = null
}: Props) {
  const router = useRouter();
  const latestIdRef = useRef<number | null>(initialLatestId);

  useEffect(() => {
    let es: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.NEXT_PUBLIC_NODE_API ||
      '';

    const openSSE = () => {
      if (!backendUrl) return;
      try {
        const url = new URL('/sse/events', backendUrl);
        url.searchParams.set('clientId', String(clientId));
        es = new EventSource(url.toString(), { withCredentials: true });

        es.onmessage = (ev) => {
          try {
            const payload = JSON.parse(ev.data);
            if (payload?.type === 'audit_complete') {
              const nextId = payload.latest?.id ?? null;
              if (nextId && nextId !== latestIdRef.current) {
                latestIdRef.current = nextId;
                router.refresh();
              }
            }
          } catch {
            // ignore JSON parse errors
          }
        };

        es.onerror = () => {
          // fall back to polling
          if (es) {
            es.close();
            es = null;
          }
          startPolling();
        };
      } catch {
        startPolling();
      }
    };

    const startPolling = () => {
      stopPolling();
      pollTimer = setInterval(async () => {
        try {
          // IMPORTANT: matches your route: /api/clients/[clientId]/audits/latest
          const res = await fetch(`/api/clients/${clientId}/audits/latest`, {
            cache: 'no-store'
          });
          if (!res.ok) return;
          const json = await res.json();
          const nextId: number | null = json?.latest?.id ?? null;
          if (nextId && nextId !== latestIdRef.current) {
            latestIdRef.current = nextId;
            router.refresh();
          }
        } catch {
          // ignore fetch errors; try again next poll
        }
      }, 5000);
    };

    const stopPolling = () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    };

    openSSE();

    return () => {
      if (es) es.close();
      stopPolling();
    };
  }, [clientId, router]);

  return null;
}

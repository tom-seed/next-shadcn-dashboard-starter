// src/app/dashboard/[clientId]/overview/LiveAuditGate.tsx
'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  clientId: number;
  initialLatestId?: number | null;
  enabled?: boolean;
};

export default function LiveAuditGate({
  clientId,
  initialLatestId = null,
  enabled = true
}: Props) {
  const router = useRouter();
  const latestIdRef = useRef<number | null>(initialLatestId);

  useEffect(() => {
    latestIdRef.current = initialLatestId ?? null;
  }, [initialLatestId]);

  useEffect(() => {
    if (!enabled) return;

    let es: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let sseErrorCount = 0;
    let shouldReconnect = true;

    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.NEXT_PUBLIC_NODE_API ||
      '';

    const stopPolling = () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    };

    const closeSSE = () => {
      if (es) {
        es.close();
        es = null;
      }
    };

    const handleEvent = (data: any) => {
      const nextId = data?.latest?.id ?? null;
      if (nextId && nextId !== latestIdRef.current) {
        latestIdRef.current = nextId;
        shouldReconnect = false;
        stopPolling();
        closeSSE();
        router.refresh();
      }
    };

    const startPolling = () => {
      if (!shouldReconnect) return;
      if (pollTimer) return;
      pollTimer = setInterval(async () => {
        try {
          const res = await fetch(`/api/clients/${clientId}/audits/latest`, {
            cache: 'no-store'
          });
          if (!res.ok) return;
          const json = await res.json();
          handleEvent(json);
        } catch {}
      }, 5000);
    };

    const scheduleSseRetry = () => {
      if (!shouldReconnect || retryTimer) return;
      const MAX_ERRORS = 3;
      if (sseErrorCount >= MAX_ERRORS || !backendUrl) {
        closeSSE();
        startPolling();
        return;
      }

      const backoff = Math.min(1500 * 2 ** sseErrorCount, 8000);
      retryTimer = setTimeout(() => {
        retryTimer = null;
        openSSE();
      }, backoff);
    };

    const openSSE = () => {
      if (!shouldReconnect) return;
      stopPolling();
      closeSSE();
      if (!backendUrl) {
        startPolling();
        return;
      }

      try {
        const url = new URL('/sse/events', backendUrl);
        url.searchParams.set('clientId', String(clientId));
        es = new EventSource(url.toString(), { withCredentials: true });
        sseErrorCount = 0;

        es.onopen = () => {
          sseErrorCount = 0;
          stopPolling();
        };

        es.onmessage = (ev) => {
          try {
            const payload = JSON.parse(ev.data);
            if (
              payload?.type === 'audit_complete' ||
              payload?.type === 'audit_snapshot'
            ) {
              handleEvent(payload);
            }
          } catch {}
        };

        es.onerror = () => {
          sseErrorCount += 1;
          scheduleSseRetry();
        };
      } catch {
        sseErrorCount += 1;
        scheduleSseRetry();
      }
    };

    openSSE();
    return () => {
      shouldReconnect = false;
      stopPolling();
      closeSSE();
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
    };
  }, [clientId, router, enabled]);

  return null;
}

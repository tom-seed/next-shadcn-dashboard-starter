'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type AuditPair = { latest: any | null; previous: any | null };

const POLL_MS = 5000;
const SSE_HANDSHAKE_TIMEOUT_MS = 8000;

function getBackendSseUrl(clientId: number | string) {
  // Prefer explicit BACKEND URL; fallback to NEXT_PUBLIC_NODE_API if you already set it
  const base =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_NODE_API ||
    '';
  if (!base) return null;
  return `${base.replace(/\/+$/, '')}/sse/events?clientId=${clientId}`;
}

async function fetchLatest(clientId: number | string): Promise<AuditPair> {
  const res = await fetch(`/api/clients/${clientId}/latest`, {
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('failed to fetch latest audit');
  const json = await res.json();
  return { latest: json.latest ?? null, previous: json.previous ?? null };
}

export function useAuditLive(clientId: number | string, initial?: AuditPair) {
  const [data, setData] = useState<AuditPair | null>(initial ?? null);
  const [status, setStatus] = useState<
    'idle' | 'connecting' | 'listening' | 'polling' | 'done'
  >(initial?.latest ? 'done' : 'idle');
  const esRef = useRef<EventSource | null>(null);
  const stoppedRef = useRef(false);

  const sseUrl = useMemo(() => getBackendSseUrl(clientId), [clientId]);

  useEffect(() => {
    if (stoppedRef.current || data?.latest) return;

    let sseTimer: any;
    let pollTimer: any;

    const startPolling = () => {
      setStatus((s) => (s === 'done' ? s : 'polling'));
      const tick = async () => {
        try {
          const fresh = await fetchLatest(clientId);
          if (fresh.latest) {
            setData(fresh);
            setStatus('done');
            clearInterval(pollTimer);
          }
        } catch {}
      };
      // immediate check, then interval
      tick();
      pollTimer = setInterval(tick, POLL_MS);
    };

    const startSse = () => {
      if (!sseUrl) return startPolling();
      setStatus('connecting');

      const es = new EventSource(sseUrl, { withCredentials: true });
      esRef.current = es;

      // If we don’t get an event quickly, fall back to polling
      sseTimer = setTimeout(() => {
        if (status !== 'done' && status !== 'polling') {
          try {
            es.close();
          } catch {}
          startPolling();
        }
      }, SSE_HANDSHAKE_TIMEOUT_MS);

      es.onopen = () => {
        setStatus('listening');
        clearTimeout(sseTimer);
      };

      es.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          if (payload?.latest) {
            setData({
              latest: payload.latest,
              previous: payload.previous ?? null
            });
            setStatus('done');
            es.close();
          }
        } catch {}
      };

      es.onerror = () => {
        // Network/proxy/SSE blocked → fall back
        try {
          es.close();
        } catch {}
        if (status !== 'done') startPolling();
      };
    };

    startSse();

    return () => {
      stoppedRef.current = true;
      clearTimeout(sseTimer);
      clearInterval(pollTimer);
      try {
        esRef.current?.close();
      } catch {}
    };
  }, [clientId, sseUrl, data?.latest, status]);

  return { data, status }; // status useful for showing “listening” vs “polling”
}

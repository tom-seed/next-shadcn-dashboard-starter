import { useEffect, useState } from 'react';

export function useAuditStream(clientId?: string | string[]) {
  const [client, setClient] = useState<{
    id: number;
    name: string;
    url: string;
  } | null>(null);
  const [latest, setLatest] = useState<any>(null);
  const [previous, setPrevious] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!clientId) return;

    let isCancelled = false;
    let eventSource: EventSource | null = null;
    const id = Array.isArray(clientId) ? clientId[0] : clientId;

    const fetchClient = async () => {
      try {
        const res = await fetch(`/api/clients/${id}`);
        if (res.ok) {
          const clientData = await res.json();
          if (!isCancelled) setClient(clientData);
        }
      } catch {}
    };

    const checkLatestAudit = async () => {
      try {
        const res = await fetch(`/api/clients/${id}/audits/latest`);
        if (res.ok) {
          const { latest, previous } = await res.json();
          if (!isCancelled && latest) {
            setLatest(latest);
            setPrevious(previous);
            return true;
          }
        }
      } catch {}
      return false;
    };

    const listenForAudit = () => {
      const base = process.env.NEXT_PUBLIC_NODE_API;
      if (!base) return;
      eventSource = new EventSource(`${base}/sse/events?clientId=${id}`);
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'audit_complete') {
            if (data.latest) setLatest(data.latest);
            if (data.previous) setPrevious(data.previous);
            eventSource?.close();
          }
        } catch {}
      };
      eventSource.onerror = () => {
        eventSource?.close();
      };
    };

    (async () => {
      setLoading(true);
      await fetchClient();
      const hasAudit = await checkLatestAudit();
      if (!hasAudit && !isCancelled) listenForAudit();
      if (!isCancelled) setLoading(false);
    })();

    return () => {
      isCancelled = true;
      eventSource?.close();
    };
  }, [clientId]);

  return { client, latest, previous, loading } as const;
}

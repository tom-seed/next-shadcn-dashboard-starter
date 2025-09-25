'use client';

import React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import PageContainer from '@/components/layout/page-container';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Heading } from '@/components/ui/heading';
import { Card } from '@/components/ui/card';

export default function NewClientPage() {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [cron, setCron] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url, cron })
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error ?? 'Failed to create client');
      }

      const payload = await res.json();
      const clientId = payload?.client?.id;

      if (clientId) {
        router.push(`/dashboard/${clientId}/overview`);
      } else {
        setError(
          'Client created, but we could not determine the redirect URL.'
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className='space-y-4 p-4'>
        <Heading
          title='New Client'
          description='Create a new client for crawling'
        />
        <Card className='p-4'>
          {error && (
            <p className='mb-2 text-sm text-red-500' role='alert'>
              {error}
            </p>
          )}
          <Input
            placeholder='Nike'
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder='https://client.com'
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Select value={cron} onValueChange={setCron}>
            <SelectTrigger>
              <SelectValue placeholder='Schedule' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='daily'>Daily</SelectItem>
              <SelectItem value='weekly'>Weekly</SelectItem>
              <SelectItem value='monthly'>Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSubmit} disabled={loading || !name.trim()}>
            {loading ? 'Crawling...' : 'Start Crawl'}
          </Button>
        </Card>
      </div>
    </PageContainer>
  );
}

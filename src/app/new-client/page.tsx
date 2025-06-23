'use client';

import React from 'react';
import { useState } from 'react';
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

export default function NewClientPage() {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [cron, setCron] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    const res = await fetch('/api/client', {
      method: 'POST',
      body: JSON.stringify({ name, url, cron })
    });
    const data = await res.json();
    alert(data.message || data.error);
    setLoading(false);
  };

  return (
    <PageContainer>
      <div className='space-y-4 p-4'>
        <h1 className='text-2xl font-bold'>New Client</h1>
        <Input
          placeholder='Client Name'
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
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Crawling...' : 'Start Crawl'}
        </Button>
      </div>
    </PageContainer>
  );
}

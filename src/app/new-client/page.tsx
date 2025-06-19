'use client';

import React from 'react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import PageContainer from '@/components/layout/page-container';

export default function NewClientPage() {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    const res = await fetch('/api/client', {
      method: 'POST',
      body: JSON.stringify({ name, url })
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
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Crawling...' : 'Start Crawl'}
        </Button>
      </div>
    </PageContainer>
  );
}

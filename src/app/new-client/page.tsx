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
import { Heading } from '@/components/ui/heading';
import { Card } from '@/components/ui/card';

export default function NewClientPage() {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [cron, setCron] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_NODE_API}/start-crawl`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, url })
        }
      );

      const data = await res.json();

      if (!data.success) {
        alert(data.error || 'Something went wrong');
      } else {
        window.location.href = data.redirectUrl;
      }
    } catch (err) {
      alert('An unexpected error occurred.');
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
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Crawling...' : 'Start Crawl'}
          </Button>
        </Card>
      </div>
    </PageContainer>
  );
}

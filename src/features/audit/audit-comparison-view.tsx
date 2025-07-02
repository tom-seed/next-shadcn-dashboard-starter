// FILE: src/features/audit/audit-comparison-view.tsx
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type Props = {
  clientId: string;
};

export default function AuditComparisonView({ clientId }: Props) {
  const [latest, setLatest] = useState<any>(null);
  const [previous, setPrevious] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/client/${clientId}/audits/latest`)
      .then((res) => res.json())
      .then((data) => {
        setLatest(data.latest);
        setPrevious(data.previous);
      });
  }, [clientId]);

  if (!latest) return <div>Loading audit data...</div>;

  const getDelta = (key: string) => {
    if (!previous) return null;
    const diff = latest[key] - previous[key];
    return diff === 0 ? null : diff > 0 ? `↑${diff}` : `↓${Math.abs(diff)}`;
  };

  return (
    <div className='mx-auto w-full'>
      <h2 className='text-2xl font-bold'>Audit Summary</h2>
      <Accordion type='multiple' className='w-full'>
        <AccordionItem value='meta'>
          <AccordionTrigger className='text-xl font-medium'>
            Metadata
          </AccordionTrigger>
          <AccordionContent>
            <ul className='list-disc pl-5'>
              <li>
                Missing Titles: {latest.pages_missing_title}{' '}
                <span className='text-muted-foreground'>
                  {getDelta('pages_missing_title')}
                </span>
              </li>
              <li>
                Too Short Title: {latest.too_short_title}{' '}
                <span className='text-muted-foreground'>
                  {getDelta('too_short_title')}
                </span>
              </li>
              <li>
                <Link
                  href={`/dashboard/${clientId}/audits/issues/too-long-title-urls`}
                  className='text-blue-600 hover:underline dark:text-blue-400'
                >
                  Too Long Title: {latest.too_long_title}
                </Link>
                <span className='text-muted-foreground ml-2'>
                  {getDelta('too_long_title')}
                </span>
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value='status'>
          <AccordionTrigger>Status Codes</AccordionTrigger>
          <AccordionContent>
            <ul className='list-disc pl-5'>
              <li>
                2xx: {latest.pages_200_response}{' '}
                <span className='text-muted-foreground'>
                  {getDelta('pages_200_response')}
                </span>
              </li>
              <li>
                4xx: {latest.pages_4xx_response}{' '}
                <span className='text-muted-foreground'>
                  {getDelta('pages_4xx_response')}
                </span>
              </li>
              {/* Add others */}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

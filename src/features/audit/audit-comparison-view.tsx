'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import PageContainer from '@/components/layout/page-container';

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
    const latestVal = latest[key] ?? 0;
    const prevVal = previous[key] ?? 0;
    const diff = latestVal - prevVal;
    return diff === 0 ? '–' : diff > 0 ? `↑${diff}` : `↓${Math.abs(diff)}`;
  };

  const renderRow = (label: string, key: string, link?: string) => {
    const latestVal = latest?.[key] ?? 0;
    const previousVal = previous?.[key] ?? 0;
    const delta = getDelta(key);

    return (
      <tr key={key}>
        <td className='py-1'>
          {link ? (
            <Link
              href={link}
              className='text-blue-600 hover:underline dark:text-blue-400'
            >
              {label}
            </Link>
          ) : (
            label
          )}
        </td>
        <td className='py-1 text-center'>{previousVal}</td>
        <td className='py-1 text-center'>{latestVal}</td>
        <td className='text-muted-foreground py-1 text-center'>{delta}</td>
      </tr>
    );
  };

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Audit Comparison'
            description='Compare the latest audit with the previous one.'
          />
        </div>
        <Separator />
        <Accordion type='multiple' className='w-full'>
          {/* Metadata Section */}
          <AccordionItem value='meta'>
            <AccordionTrigger className='text-xl font-medium'>
              Metadata
            </AccordionTrigger>
            <AccordionContent>
              <table className='w-full table-auto border-separate border-spacing-y-1 text-sm'>
                <thead className='text-muted-foreground'>
                  <tr>
                    <th className='text-left'>Metric</th>
                    <th className='text-center'>Previous</th>
                    <th className='text-center'>Current</th>
                    <th className='text-center'>Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {renderRow(
                    'Missing Titles',
                    'pages_missing_title',
                    `/dashboard/${clientId}/audits/issues/pages-missing-title`
                  )}
                  {renderRow(
                    'Too Short Title',
                    'too_short_title',
                    `/dashboard/${clientId}/audits/issues/too-short-title`
                  )}
                  {renderRow(
                    'Too Long Title',
                    'too_long_title',
                    `/dashboard/${clientId}/audits/issues/too-long-title`
                  )}
                  {renderRow(
                    'Missing Descriptions',
                    'pages_missing_description',
                    `/dashboard/${clientId}/audits/issues/pages-missing-description`
                  )}
                  {renderRow(
                    'Too Short Description',
                    'too_short_description',
                    `/dashboard/${clientId}/audits/issues/too-short-description`
                  )}
                  {renderRow(
                    'Too Long Description',
                    'too_long_description',
                    `/dashboard/${clientId}/audits/issues/too-long-description`
                  )}
                </tbody>
              </table>
            </AccordionContent>
          </AccordionItem>

          {/* Status Codes Section */}
          <AccordionItem value='status'>
            <AccordionTrigger className='text-xl font-medium'>
              Status Codes
            </AccordionTrigger>
            <AccordionContent>
              <table className='w-full table-auto border-separate border-spacing-y-1 text-sm'>
                <thead className='text-muted-foreground'>
                  <tr>
                    <th className='text-left'>Metric</th>
                    <th className='text-center'>Previous</th>
                    <th className='text-center'>Current</th>
                    <th className='text-center'>Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {renderRow(
                    '2xx Responses',
                    'pages_200_response',
                    `/dashboard/${clientId}/audits/issues/pages-2xx-response`
                  )}
                  {renderRow(
                    '3xx Errors',
                    'pages_3xx_response',
                    `/dashboard/${clientId}/audits/issues/pages-3xx-response`
                  )}
                  {renderRow(
                    '4xx Errors',
                    'pages_4xx_response',
                    `/dashboard/${clientId}/audits/issues/pages-4xx-response`
                  )}
                  {renderRow(
                    '5xx Errors',
                    'pages_5xx_response',
                    `/dashboard/${clientId}/audits/issues/pages-5xx-response`
                  )}
                </tbody>
              </table>
            </AccordionContent>
          </AccordionItem>
          {/* Headings Section */}
          <AccordionItem value='headings'>
            <AccordionTrigger className='text-xl font-medium'>
              Headings
            </AccordionTrigger>
            <AccordionContent>
              <table className='w-full table-auto border-separate border-spacing-y-1 text-sm'>
                <thead className='text-muted-foreground'>
                  <tr>
                    <th className='text-left'>Metric</th>
                    <th className='text-center'>Previous</th>
                    <th className='text-center'>Current</th>
                    <th className='text-center'>Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {renderRow(
                    'Missing H1',
                    'pages_missing_h1',
                    `/dashboard/${clientId}/audits/issues/pages-missing-h1`
                  )}
                  {renderRow(
                    'Missing H2',
                    'pages_missing_h2',
                    `/dashboard/${clientId}/audits/issues/pages-missing-h2`
                  )}
                  {renderRow(
                    'Missing H3',
                    'pages_missing_h3',
                    `/dashboard/${clientId}/audits/issues/pages-missing-h3`
                  )}
                  {renderRow(
                    'Missing H4',
                    'pages_missing_h4',
                    `/dashboard/${clientId}/audits/issues/pages-missing-h4`
                  )}
                  {renderRow(
                    'Missing H5',
                    'pages_missing_h5',
                    `/dashboard/${clientId}/audits/issues/pages-missing-h5`
                  )}
                  {renderRow(
                    'Missing H6',
                    'pages_missing_h6',
                    `/dashboard/${clientId}/audits/issues/pages-missing-h6`
                  )}
                  {renderRow(
                    'Multiple H1',
                    'pages_with_multiple_h1s',
                    `/dashboard/${clientId}/audits/issues/pages-with-multiple-h1s`
                  )}
                  {renderRow(
                    'Multiple H2',
                    'pages_with_multiple_h2s',
                    `/dashboard/${clientId}/audits/issues/pages-with-multiple-h2s`
                  )}
                  {renderRow(
                    'Multiple H3',
                    'pages_with_multiple_h3s',
                    `/dashboard/${clientId}/audits/issues/pages-with-multiple-h3s`
                  )}
                  {renderRow(
                    'Multiple H4',
                    'pages_with_multiple_h4s',
                    `/dashboard/${clientId}/audits/issues/pages-with-multiple-h4s`
                  )}
                  {renderRow(
                    'Multiple H5',
                    'pages_with_multiple_h5s',
                    `/dashboard/${clientId}/audits/issues/pages-with-multiple-h5s`
                  )}
                  {renderRow(
                    'Multiple H6',
                    'pages_with_multiple_h6s',
                    `/dashboard/${clientId}/audits/issues/pages-with-multiple-h6s`
                  )}
                  {renderRow(
                    'Duplicate H1',
                    'pages_with_duplicate_h1s',
                    `/dashboard/${clientId}/audits/issues/pages-with-duplicate-h1s`
                  )}
                  {renderRow(
                    'Duplicate H2',
                    'pages_with_duplicate_h2s',
                    `/dashboard/${clientId}/audits/issues/pages-with-duplicate-h2s`
                  )}
                  {renderRow(
                    'Duplicate H3',
                    'pages_with_duplicate_h3s',
                    `/dashboard/${clientId}/audits/issues/pages-with-duplicate-h3s`
                  )}
                  {renderRow(
                    'Duplicate H4',
                    'pages_with_duplicate_h4s',
                    `/dashboard/${clientId}/audits/issues/pages-with-duplicate-h4s`
                  )}
                  {renderRow(
                    'Duplicate H5',
                    'pages_with_duplicate_h5s',
                    `/dashboard/${clientId}/audits/issues/pages-with-duplicate-h5s`
                  )}
                  {renderRow(
                    'Duplicate H6',
                    'pages_with_duplicate_h6s',
                    `/dashboard/${clientId}/audits/issues/pages-with-duplicate-h6s`
                  )}
                </tbody>
              </table>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </PageContainer>
  );
}

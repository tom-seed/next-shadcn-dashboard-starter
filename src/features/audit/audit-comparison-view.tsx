'use client';

import { JSX, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import PageContainer from '@/components/layout/page-container';
import { AuditLoadingSpinner } from '@/components/ui/audit-loading-spinner';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@radix-ui/react-tooltip';
import { Info } from 'lucide-react';

type Props = {
  clientId: string;
};

export default function AuditComparisonView({ clientId }: Props) {
  const [latest, setLatest] = useState<any>(null);
  const [previous, setPrevious] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/clients/${clientId}/audits/latest`)
      .then((res) => res.json())
      .then((data) => {
        setLatest(data.latest);
        setPrevious(data.previous);
      });
  }, [clientId]);

  if (!latest)
    return (
      <div className='flex min-h-[60vh] flex-1 flex-col items-center justify-center space-y-4'>
        <AuditLoadingSpinner />
      </div>
    );

  const renderRow = (label: string, key: string, link?: string) => {
    const latestVal = latest?.[key] ?? 0;
    const previousVal = previous?.[key] ?? 0;
    const diff = latestVal - previousVal;

    const delta =
      diff === 0 ? '–' : diff > 0 ? `↑${diff}` : `↓${Math.abs(diff)}`;

    const getDeltaClass = () => {
      if (diff === 0) return 'text-muted-foreground';
      return diff > 0
        ? 'text-red-600 dark:text-red-400'
        : 'text-green-600 dark:text-green-400';
    };

    return (
      <tr
        key={key}
        className='border-border/50 hover:bg-muted/40 border-b transition-colors'
      >
        <td className='py-2'>
          {link ? (
            <Link
              href={link}
              className='font-medium text-blue-600 hover:underline dark:text-blue-400'
            >
              {label}
            </Link>
          ) : (
            label
          )}
          {previousVal <= 0 && latestVal > 0 && (
            <span className='ml-2 text-red-600 dark:text-red-400'>New</span>
          )}
          {previousVal > 0 && latestVal <= 0 && (
            <span className='ml-2 text-green-600 dark:text-green-400'>
              Fixed
            </span>
          )}
        </td>
        <td className='py-2 text-center'>{previousVal}</td>
        <td className='py-2 text-center'>{latestVal}</td>
        <td className={`py-2 text-center font-medium ${getDeltaClass()}`}>
          {delta}
        </td>
      </tr>
    );
  };

  const renderSection = (title: string, rows: JSX.Element[]) => {
    const sectionValue = title.toLowerCase().replace(/\s+/g, '-');

    return (
      <AccordionItem key={sectionValue} value={sectionValue} className='w-full'>
        <AccordionTrigger className='text-muted-foreground w-full text-sm font-semibold tracking-wider uppercase'>
          {title}
        </AccordionTrigger>
        <AccordionContent>
          <Separator className='mb-2' />
          <table className='w-full table-fixed border-collapse text-sm'>
            <thead className='text-muted-foreground bg-muted/30'>
              <tr>
                <th className='w-[45%] py-2 text-left'>Metric</th>
                <th className='w-[18%] py-2 text-center'>Previous</th>
                <th className='w-[18%] py-2 text-center'>Current</th>
                <th className='w-[14%] py-2 text-center'>Change</th>
              </tr>
            </thead>
            <tbody className='[&>tr:nth-child(even)]:bg-muted/20'>{rows}</tbody>
          </table>
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Audit Comparison'
            description='Compare the latest audit with the previous one.'
          />
        </div>

        <Accordion type='multiple' className=''>
          {/* Metadata Section */}
          {renderSection('Metadata', [
            renderRow(
              'Missing Titles',
              'pages_missing_title',
              `/dashboard/${clientId}/audits/issues/pages-missing-title`
            ),
            renderRow(
              'Too Short Title',
              'too_short_title',
              `/dashboard/${clientId}/audits/issues/too-short-title`
            ),
            renderRow(
              'Too Long Title',
              'too_long_title',
              `/dashboard/${clientId}/audits/issues/too-long-title`
            ),
            renderRow(
              'Missing Descriptions',
              'pages_missing_description',
              `/dashboard/${clientId}/audits/issues/pages-missing-description`
            ),
            renderRow(
              'Too Short Description',
              'too_short_description',
              `/dashboard/${clientId}/audits/issues/too-short-description`
            ),
            renderRow(
              'Too Long Description',
              'too_long_description',
              `/dashboard/${clientId}/audits/issues/too-long-description`
            )
          ])}

          {/* Status Codes Section */}
          {renderSection('Status Codes', [
            renderRow(
              '3xx Errors',
              'pages_3xx_response',
              `/dashboard/${clientId}/audits/issues/pages-3xx-response`
            ),
            renderRow(
              '4xx Errors',
              'pages_4xx_response',
              `/dashboard/${clientId}/audits/issues/pages-4xx-response`
            ),
            renderRow(
              '5xx Errors',
              'pages_5xx_response',
              `/dashboard/${clientId}/audits/issues/pages-5xx-response`
            )
          ])}

          {/* Internal Link Section */}
          {renderSection('Internal Link', [
            renderRow(
              'Orphaned Pages',
              'pages_orphaned',
              `/dashboard/${clientId}/audits/issues/pages-orphaned`
            ),
            renderRow(
              'Broken Internal Links',
              'pages_with_broken_internal_links',
              `/dashboard/${clientId}/audits/issues/pages-with-broken-internal-links`
            ),
            renderRow(
              'Redirect Internal Links',
              'pages_with_redirect_links',
              `/dashboard/${clientId}/audits/issues/pages-with-redirect-links`
            )
          ])}

          {/* Hreflang Section */}
          {renderSection('Hreflang', [
            renderRow(
              'Missing Return Tag',
              'pages_hreflang_missing_return_tag',
              `/dashboard/${clientId}/audits/issues/pages-hreflang-missing-return-tag`
            ),
            renderRow(
              'Broken Hreflang Links',
              'pages_hreflang_broken_links',
              `/dashboard/${clientId}/audits/issues/pages-hreflang-broken-links`
            ),
            renderRow(
              'Missing Self Ref',
              'pages_hreflang_missing_self_ref',
              `/dashboard/${clientId}/audits/issues/pages-hreflang-missing-self-ref`
            ),
            renderRow(
              'Missing X Default',
              'pages_missing_hreflang_x_default',
              `/dashboard/${clientId}/audits/issues/pages-missing-hreflang-x-default`
            )
          ])}

          {/* Indexability Section */}
          {renderSection('Indexability', [
            renderRow(
              'Missing Canonical',
              'pages_missing_canonical',
              `/dashboard/${clientId}/audits/issues/pages-missing-canonical`
            ),
            renderRow(
              'Canonicalised Pages',
              'pages_canonicalised',
              `/dashboard/${clientId}/audits/issues/pages-canonicalised`
            )
          ])}

          {/* Headings Section */}
          {renderSection('Headings', [
            renderRow(
              'Missing H1',
              'pages_missing_h1',
              `/dashboard/${clientId}/audits/issues/pages-missing-h1`
            ),
            renderRow(
              'Multiple H1',
              'pages_with_multiple_h1s',
              `/dashboard/${clientId}/audits/issues/pages-with-multiple-h1s`
            ),
            renderRow(
              'Duplicate H1',
              'pages_with_duplicate_h1s',
              `/dashboard/${clientId}/audits/issues/pages-with-duplicate-h1s`
            ),
            renderRow(
              'Missing H2',
              'pages_missing_h2',
              `/dashboard/${clientId}/audits/issues/pages-missing-h2`
            ),
            renderRow(
              'Multiple H2',
              'pages_with_multiple_h2s',
              `/dashboard/${clientId}/audits/issues/pages-with-multiple-h2s`
            ),
            renderRow(
              'Duplicate H2',
              'pages_with_duplicate_h2s',
              `/dashboard/${clientId}/audits/issues/pages-with-duplicate-h2s`
            ),
            renderRow(
              'Missing H3',
              'pages_missing_h3',
              `/dashboard/${clientId}/audits/issues/pages-missing-h3`
            ),
            renderRow(
              'Duplicate H3',
              'pages_with_duplicate_h3s',
              `/dashboard/${clientId}/audits/issues/pages-with-duplicate-h3s`
            ),
            renderRow(
              'Missing H4',
              'pages_missing_h4',
              `/dashboard/${clientId}/audits/issues/pages-missing-h4`
            ),
            renderRow(
              'Duplicate H4',
              'pages_with_duplicate_h4s',
              `/dashboard/${clientId}/audits/issues/pages-with-duplicate-h4s`
            ),
            renderRow(
              'Missing H5',
              'pages_missing_h5',
              `/dashboard/${clientId}/audits/issues/pages-missing-h5`
            ),
            renderRow(
              'Duplicate H5',
              'pages_with_duplicate_h5s',
              `/dashboard/${clientId}/audits/issues/pages-with-duplicate-h5s`
            ),
            renderRow(
              'Missing H6',
              'pages_missing_h6',
              `/dashboard/${clientId}/audits/issues/pages-missing-h6`
            ),
            renderRow(
              'Duplicate H6',
              'pages_with_duplicate_h6s',
              `/dashboard/${clientId}/audits/issues/pages-with-duplicate-h6s`
            )
          ])}
        </Accordion>
      </div>
    </PageContainer>
  );
}

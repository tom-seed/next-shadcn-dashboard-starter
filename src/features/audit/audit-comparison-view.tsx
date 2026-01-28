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
    const latestVal = latest?.semantic?.[key] ?? latest?.[key] ?? 0;
    const previousVal = previous?.semantic?.[key] ?? previous?.[key] ?? 0;
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

        {/* Quick Stats Section */}
        <div className='grid gap-4 md:grid-cols-4'>
          <div className='bg-card text-card-foreground rounded-xl border shadow'>
            <div className='flex flex-row items-center justify-between space-y-0 p-6 pb-2'>
              <h3 className='text-sm font-medium tracking-tight'>
                Health Score
              </h3>
            </div>
            <div className='p-6 pt-0'>
              <div className='text-2xl font-bold'>{latest?.score ?? 0}</div>
              <p className='text-muted-foreground text-xs'>
                {latest?.score && previous?.score
                  ? `${latest.score - previous.score > 0 ? '+' : ''}${latest.score - previous.score} from last audit`
                  : 'No change'}
              </p>
            </div>
          </div>
          <div className='bg-card text-card-foreground rounded-xl border shadow'>
            <div className='flex flex-row items-center justify-between space-y-0 p-6 pb-2'>
              <h3 className='text-sm font-medium tracking-tight'>
                Total Pages
              </h3>
            </div>
            <div className='p-6 pt-0'>
              <div className='text-2xl font-bold'>
                {(latest?.pages_200_response ?? 0) +
                  (latest?.pages_3xx_response ?? 0) +
                  (latest?.pages_4xx_response ?? 0) +
                  (latest?.pages_5xx_response ?? 0)}
              </div>
              <p className='text-muted-foreground text-xs'>Crawled URLs</p>
            </div>
          </div>
          <div className='bg-card text-card-foreground rounded-xl border shadow'>
            <div className='flex flex-row items-center justify-between space-y-0 p-6 pb-2'>
              <h3 className='text-sm font-medium tracking-tight'>
                Critical Issues
              </h3>
            </div>
            <div className='p-6 pt-0'>
              <div className='text-2xl font-bold'>
                {(latest?.pages_4xx_response ?? 0) +
                  (latest?.pages_5xx_response ?? 0) +
                  (latest?.pages_missing_title ?? 0) +
                  (latest?.pages_missing_description ?? 0) +
                  (latest?.pages_missing_h1 ?? 0)}
              </div>
              <p className='text-muted-foreground text-xs'>
                Requires attention
              </p>
            </div>
          </div>
          <div className='bg-card text-card-foreground rounded-xl border shadow'>
            <div className='flex flex-row items-center justify-between space-y-0 p-6 pb-2'>
              <h3 className='text-sm font-medium tracking-tight'>Warnings</h3>
            </div>
            <div className='p-6 pt-0'>
              <div className='text-2xl font-bold'>
                {(latest?.pages_3xx_response ?? 0) +
                  (latest?.pages_with_duplicate_h1s ?? 0) +
                  (latest?.pages_with_multiple_h1s ?? 0)}
              </div>
              <p className='text-muted-foreground text-xs'>To improve</p>
            </div>
          </div>
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

          {/* 3xx Redirects Breakdown */}
          {renderSection('3xx Redirects', [
            renderRow(
              '301 Permanent Redirect',
              'pages_301_permanent',
              `/dashboard/${clientId}/audits/issues/pages-301-permanent`
            ),
            renderRow(
              '302 Temporary Redirect',
              'pages_302_temporary',
              `/dashboard/${clientId}/audits/issues/pages-302-temporary`
            ),
            renderRow(
              '303 See Other',
              'pages_303_see_other',
              `/dashboard/${clientId}/audits/issues/pages-303-see-other`
            ),
            renderRow(
              '307 Temporary Redirect',
              'pages_307_temporary',
              `/dashboard/${clientId}/audits/issues/pages-307-temporary`
            ),
            renderRow(
              '308 Permanent Redirect',
              'pages_308_permanent',
              `/dashboard/${clientId}/audits/issues/pages-308-permanent`
            ),
            renderRow(
              'Other 3xx Codes',
              'pages_3xx_other',
              `/dashboard/${clientId}/audits/issues/pages-3xx-other`
            )
          ])}

          {/* 4xx Client Errors Breakdown */}
          {renderSection('4xx Client Errors', [
            renderRow(
              '401 Unauthorized',
              'pages_401_unauthorized',
              `/dashboard/${clientId}/audits/issues/pages-401-unauthorized`
            ),
            renderRow(
              '403 Forbidden',
              'pages_403_forbidden',
              `/dashboard/${clientId}/audits/issues/pages-403-forbidden`
            ),
            renderRow(
              '404 Not Found',
              'pages_404_not_found',
              `/dashboard/${clientId}/audits/issues/pages-404-not-found`
            ),
            renderRow(
              '405 Method Not Allowed',
              'pages_405_method_not_allowed',
              `/dashboard/${clientId}/audits/issues/pages-405-method-not-allowed`
            ),
            renderRow(
              '408 Request Timeout',
              'pages_408_timeout',
              `/dashboard/${clientId}/audits/issues/pages-408-timeout`
            ),
            renderRow(
              '410 Gone',
              'pages_410_gone',
              `/dashboard/${clientId}/audits/issues/pages-410-gone`
            ),
            renderRow(
              '429 Too Many Requests',
              'pages_429_rate_limited',
              `/dashboard/${clientId}/audits/issues/pages-429-rate-limited`
            ),
            renderRow(
              'Other 4xx Codes',
              'pages_4xx_other',
              `/dashboard/${clientId}/audits/issues/pages-4xx-other`
            )
          ])}

          {/* 5xx Server Errors Breakdown */}
          {renderSection('5xx Server Errors', [
            renderRow(
              '500 Internal Server Error',
              'pages_500_internal_error',
              `/dashboard/${clientId}/audits/issues/pages-500-internal-error`
            ),
            renderRow(
              '502 Bad Gateway',
              'pages_502_bad_gateway',
              `/dashboard/${clientId}/audits/issues/pages-502-bad-gateway`
            ),
            renderRow(
              '503 Service Unavailable',
              'pages_503_unavailable',
              `/dashboard/${clientId}/audits/issues/pages-503-unavailable`
            ),
            renderRow(
              '504 Gateway Timeout',
              'pages_504_timeout',
              `/dashboard/${clientId}/audits/issues/pages-504-timeout`
            ),
            renderRow(
              'Other 5xx Codes',
              'pages_5xx_other',
              `/dashboard/${clientId}/audits/issues/pages-5xx-other`
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
            ),
            renderRow(
              'Canonical Points To Redirect',
              'canonical_points_to_redirect',
              `/dashboard/${clientId}/audits/issues/canonical-points-to-redirect`
            ),
            renderRow(
              'Canonical Points To 404',
              'canonical_points_to_404',
              `/dashboard/${clientId}/audits/issues/canonical-points-to-404`
            ),
            renderRow(
              'Canonical Points To 4xx',
              'canonical_points_to_4xx',
              `/dashboard/${clientId}/audits/issues/canonical-points-to-4xx`
            ),
            renderRow(
              'Canonical Points To 5xx',
              'canonical_points_to_5xx',
              `/dashboard/${clientId}/audits/issues/canonical-points-to-5xx`
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

          {/* Image Audits Section */}
          {renderSection('Image Audits', [
            renderRow('Total Images', 'total_images'),
            renderRow(
              'Images Missing Alt Text',
              'total_images_missing_alt',
              `/dashboard/${clientId}/audits/issues/total-images-missing-alt`
            ),
            renderRow(
              'Images with Empty Alt Text',
              'total_images_empty_alt',
              `/dashboard/${clientId}/audits/issues/total-images-empty-alt`
            ),
            renderRow(
              'Images Missing Dimensions',
              'total_images_missing_dimensions',
              `/dashboard/${clientId}/audits/issues/total-images-missing-dimensions`
            ),
            renderRow(
              'Images with Unoptimized Format',
              'total_images_unoptimized_format',
              `/dashboard/${clientId}/audits/issues/total-images-unoptimized-format`
            ),
            renderRow(
              'Pages with Missing Alt Images',
              'pages_with_images_missing_alt',
              `/dashboard/${clientId}/audits/issues/pages-with-images-missing-alt`
            ),
            renderRow(
              'Pages with Empty Alt Images',
              'pages_with_images_empty_alt',
              `/dashboard/${clientId}/audits/issues/pages-with-images-empty-alt`
            ),
            renderRow(
              'Pages with Missing Dimension Images',
              'pages_with_images_missing_dimensions',
              `/dashboard/${clientId}/audits/issues/pages-with-images-missing-dimensions`
            ),
            renderRow(
              'Pages with Unoptimized Images',
              'pages_with_unoptimized_image_format',
              `/dashboard/${clientId}/audits/issues/pages-with-unoptimized-image-format`
            )
          ])}
        </Accordion>
      </div>
    </PageContainer>
  );
}

import type { ComponentType } from 'react';

import {
  TitlesTooLong,
  TitlesTooShort,
  TitlesMissing
} from '../issue-descriptions/titles';
import {
  DescriptionsTooLong,
  DescriptionsTooShort,
  DescriptionsMissing
} from '../issue-descriptions/descriptions';
import {
  Heading1Missing,
  Heading1Multiple,
  Heading1Duplicate,
  Heading2Missing,
  Heading2Multiple,
  Heading2Duplicate,
  Heading3Missing,
  Heading3Multiple,
  Heading3Duplicate,
  Heading4Missing,
  Heading4Multiple,
  Heading4Duplicate,
  Heading5Missing,
  Heading5Multiple,
  Heading5Duplicate,
  Heading6Missing,
  Heading6Multiple,
  Heading6Duplicate
} from '../issue-descriptions/headings';
import {
  MissingCanonical,
  Canonicalised,
  CanonicalPointsToRedirect,
  CanonicalPointsTo404,
  CanonicalPointsTo4xx,
  CanonicalPointsTo5xx
} from '../issue-descriptions/canonicals';
import {
  OrphanedPages,
  BrokenInternalLinks,
  RedirectInternalLinks
} from '../issue-descriptions/internal-links';
import {
  HreflangMissingReturnTag,
  HreflangBrokenLinks,
  HreflangMissingSelfRef,
  HreflangMissingXDefault
} from '../issue-descriptions/hreflang';
import {
  ImagesMissingAlt,
  ImagesEmptyAlt,
  ImagesMissingDimensions,
  ImagesUnoptimizedFormat,
  PagesWithImagesMissingAlt,
  PagesWithImagesEmptyAlt,
  PagesWithImagesMissingDimensions,
  PagesWithUnoptimizedImages
} from '../issue-descriptions/images';
import {
  Status301Permanent,
  Status302Temporary,
  Status303SeeOther,
  Status307Temporary,
  Status308Permanent,
  Status401Unauthorized,
  Status403Forbidden,
  Status404NotFound,
  Status405MethodNotAllowed,
  Status408Timeout,
  Status410Gone,
  Status429RateLimited,
  Status500InternalError,
  Status502BadGateway,
  Status503Unavailable,
  Status504Timeout
} from '../issue-descriptions/status-codes';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Severity = 'critical' | 'warning' | 'opportunity' | 'info';

export type IssueSection =
  | 'metadata'
  | 'headings'
  | 'redirects_3xx'
  | 'errors_4xx'
  | 'errors_5xx'
  | 'internal_links'
  | 'canonicals'
  | 'hreflang'
  | 'images';

export interface IssueDefinition {
  field: string;
  label: string;
  description: string;
  severity: Severity;
  section: IssueSection;
}

export interface SectionDefinition {
  key: IssueSection;
  title: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

export const SECTIONS: SectionDefinition[] = [
  {
    key: 'metadata',
    title: 'Page Titles & Descriptions',
    description: 'How your pages appear in search results'
  },
  {
    key: 'headings',
    title: 'Heading Structure',
    description: 'How your page content is organised with headings'
  },
  {
    key: 'redirects_3xx',
    title: 'Redirects',
    description: 'Pages that send visitors to a different URL'
  },
  {
    key: 'errors_4xx',
    title: 'Client Errors (4xx)',
    description: 'Pages that could not be found or accessed'
  },
  {
    key: 'errors_5xx',
    title: 'Server Errors (5xx)',
    description: 'Pages where the server failed to respond'
  },
  {
    key: 'internal_links',
    title: 'Internal Links',
    description: 'How pages link to each other within your site'
  },
  {
    key: 'canonicals',
    title: 'Canonical Tags',
    description: 'Which version of a page search engines should index'
  },
  {
    key: 'hreflang',
    title: 'Language Targeting',
    description: 'International and multilingual page configuration'
  },
  {
    key: 'images',
    title: 'Images',
    description: 'Accessibility and optimisation of images across your site'
  }
];

// ---------------------------------------------------------------------------
// Issue Registry
// ---------------------------------------------------------------------------

export const ISSUE_REGISTRY: IssueDefinition[] = [
  // ── Metadata ──────────────────────────────────────────────────────────────
  {
    field: 'pages_missing_title',
    label: 'Missing Page Titles',
    description:
      'Pages without a title tag — search engines will generate one from your content',
    severity: 'critical',
    section: 'metadata'
  },
  {
    field: 'too_short_title',
    label: 'Too Short Titles',
    description:
      'Titles under 30 characters that miss the chance to include useful keywords',
    severity: 'opportunity',
    section: 'metadata'
  },
  {
    field: 'too_long_title',
    label: 'Too Long Titles',
    description: 'Titles over 60 characters that get cut off in search results',
    severity: 'opportunity',
    section: 'metadata'
  },
  {
    field: 'pages_missing_description',
    label: 'Missing Descriptions',
    description:
      'Pages without a meta description — search engines will pick text from the page instead',
    severity: 'critical',
    section: 'metadata'
  },
  {
    field: 'too_short_description',
    label: 'Too Short Descriptions',
    description:
      'Meta descriptions under 70 characters that could say more about the page',
    severity: 'opportunity',
    section: 'metadata'
  },
  {
    field: 'too_long_description',
    label: 'Too Long Descriptions',
    description:
      'Meta descriptions over 160 characters that get truncated in search results',
    severity: 'opportunity',
    section: 'metadata'
  },

  // ── Headings ──────────────────────────────────────────────────────────────
  {
    field: 'pages_missing_h1',
    label: 'Missing H1',
    description:
      'Pages without a main heading — search engines rely on H1 to understand the topic',
    severity: 'critical',
    section: 'headings'
  },
  {
    field: 'pages_with_multiple_h1s',
    label: 'Multiple H1s',
    description:
      'Pages with more than one H1 heading, which can dilute the main topic signal',
    severity: 'warning',
    section: 'headings'
  },
  {
    field: 'pages_with_duplicate_h1s',
    label: 'Duplicate H1s',
    description: 'Pages sharing the same H1 text as other pages on your site',
    severity: 'warning',
    section: 'headings'
  },
  {
    field: 'pages_missing_h2',
    label: 'Missing H2',
    description:
      'Pages without subheadings to break up content into scannable sections',
    severity: 'warning',
    section: 'headings'
  },
  {
    field: 'pages_with_multiple_h2s',
    label: 'Multiple H2s',
    description:
      'Pages with several H2 subheadings — usually fine, but worth reviewing',
    severity: 'opportunity',
    section: 'headings'
  },
  {
    field: 'pages_with_duplicate_h2s',
    label: 'Duplicate H2s',
    description:
      'Pages sharing the same H2 text as other pages, which may signal repetitive content',
    severity: 'warning',
    section: 'headings'
  },

  // ── 3xx Redirects ─────────────────────────────────────────────────────────
  {
    field: 'pages_301_permanent',
    label: '301 Permanent Redirect',
    description:
      'Pages permanently moved to a new URL — normal for site migrations',
    severity: 'info',
    section: 'redirects_3xx'
  },
  {
    field: 'pages_302_temporary',
    label: '302 Temporary Redirect',
    description:
      'Pages temporarily redirected — search engines keep indexing the original URL',
    severity: 'warning',
    section: 'redirects_3xx'
  },
  {
    field: 'pages_303_see_other',
    label: '303 See Other',
    description:
      'Redirect responses after form submissions — typically expected',
    severity: 'info',
    section: 'redirects_3xx'
  },
  {
    field: 'pages_307_temporary',
    label: '307 Temporary Redirect',
    description: 'Strict temporary redirect that preserves the request method',
    severity: 'warning',
    section: 'redirects_3xx'
  },
  {
    field: 'pages_308_permanent',
    label: '308 Permanent Redirect',
    description: 'Strict permanent redirect that preserves the request method',
    severity: 'info',
    section: 'redirects_3xx'
  },
  {
    field: 'pages_3xx_other',
    label: 'Other 3xx Redirects',
    description: 'Less common redirect status codes worth investigating',
    severity: 'warning',
    section: 'redirects_3xx'
  },

  // ── 4xx Client Errors ─────────────────────────────────────────────────────
  {
    field: 'pages_404_not_found',
    label: '404 Not Found',
    description:
      'Pages that no longer exist — visitors and search engines hit a dead end',
    severity: 'critical',
    section: 'errors_4xx'
  },
  {
    field: 'pages_401_unauthorized',
    label: '401 Unauthorized',
    description:
      'Pages requiring authentication that search engines cannot access',
    severity: 'warning',
    section: 'errors_4xx'
  },
  {
    field: 'pages_403_forbidden',
    label: '403 Forbidden',
    description: 'Pages blocked by server permissions',
    severity: 'warning',
    section: 'errors_4xx'
  },
  {
    field: 'pages_405_method_not_allowed',
    label: '405 Method Not Allowed',
    description: 'Pages rejecting the HTTP method used to request them',
    severity: 'warning',
    section: 'errors_4xx'
  },
  {
    field: 'pages_408_timeout',
    label: '408 Request Timeout',
    description: 'Pages that took too long to respond to the request',
    severity: 'warning',
    section: 'errors_4xx'
  },
  {
    field: 'pages_410_gone',
    label: '410 Gone',
    description:
      'Pages intentionally removed — search engines will drop them from the index',
    severity: 'info',
    section: 'errors_4xx'
  },
  {
    field: 'pages_429_rate_limited',
    label: '429 Rate Limited',
    description:
      'Requests blocked because the server received too many in a short time',
    severity: 'warning',
    section: 'errors_4xx'
  },
  {
    field: 'pages_4xx_other',
    label: 'Other 4xx Errors',
    description: 'Less common client error codes worth investigating',
    severity: 'warning',
    section: 'errors_4xx'
  },

  // ── 5xx Server Errors ─────────────────────────────────────────────────────
  {
    field: 'pages_500_internal_error',
    label: '500 Internal Server Error',
    description: 'The server crashed while trying to serve this page',
    severity: 'critical',
    section: 'errors_5xx'
  },
  {
    field: 'pages_502_bad_gateway',
    label: '502 Bad Gateway',
    description: 'An upstream server sent an invalid response',
    severity: 'critical',
    section: 'errors_5xx'
  },
  {
    field: 'pages_503_unavailable',
    label: '503 Service Unavailable',
    description: 'The server is temporarily overloaded or down for maintenance',
    severity: 'critical',
    section: 'errors_5xx'
  },
  {
    field: 'pages_504_timeout',
    label: '504 Gateway Timeout',
    description: 'An upstream server did not respond in time',
    severity: 'critical',
    section: 'errors_5xx'
  },
  {
    field: 'pages_5xx_other',
    label: 'Other 5xx Errors',
    description: 'Less common server error codes worth investigating',
    severity: 'critical',
    section: 'errors_5xx'
  },

  // ── Internal Links ────────────────────────────────────────────────────────
  {
    field: 'total_orphaned_pages',
    label: 'Orphaned Pages',
    description:
      'Pages with no internal links pointing to them — visitors and search engines cannot find them',
    severity: 'critical',
    section: 'internal_links'
  },
  {
    field: 'total_broken_internal_links',
    label: 'Broken Internal Links',
    description:
      'Links to pages on your site that return errors — visitors hit dead ends',
    severity: 'critical',
    section: 'internal_links'
  },
  {
    field: 'total_redirect_internal_links',
    label: 'Redirect Internal Links',
    description:
      'Links pointing to pages that redirect — update them to point directly to the final URL',
    severity: 'warning',
    section: 'internal_links'
  },

  // ── Canonicals ────────────────────────────────────────────────────────────
  {
    field: 'pages_missing_canonical',
    label: 'Missing Canonical Tag',
    description:
      'Pages without a canonical tag — search engines may index duplicate versions',
    severity: 'warning',
    section: 'canonicals'
  },
  {
    field: 'pages_canonicalised',
    label: 'Canonicalised Pages',
    description:
      'Pages pointing their canonical to a different URL — confirming the preferred version',
    severity: 'info',
    section: 'canonicals'
  },
  {
    field: 'canonical_points_to_redirect',
    label: 'Canonical Points to Redirect',
    description:
      'The preferred-URL tag sends search engines to a page that redirects',
    severity: 'warning',
    section: 'canonicals'
  },
  {
    field: 'canonical_points_to_404',
    label: 'Canonical Points to 404',
    description:
      'The preferred-URL tag sends search engines to a page that no longer exists',
    severity: 'critical',
    section: 'canonicals'
  },
  {
    field: 'canonical_points_to_4xx',
    label: 'Canonical Points to 4xx',
    description:
      'The preferred-URL tag sends search engines to a page returning a client error',
    severity: 'critical',
    section: 'canonicals'
  },
  {
    field: 'canonical_points_to_5xx',
    label: 'Canonical Points to 5xx',
    description:
      'The preferred-URL tag sends search engines to a page returning a server error',
    severity: 'critical',
    section: 'canonicals'
  },

  // ── Hreflang ──────────────────────────────────────────────────────────────
  {
    field: 'pages_hreflang_missing_return_tag',
    label: 'Missing Return Tag',
    description:
      "Language tags that don't link back — search engines ignore one-way hreflang",
    severity: 'warning',
    section: 'hreflang'
  },
  {
    field: 'pages_hreflang_broken_links',
    label: 'Broken Hreflang Links',
    description:
      'Language alternate links pointing to pages that return errors',
    severity: 'critical',
    section: 'hreflang'
  },
  {
    field: 'pages_hreflang_missing_self_ref',
    label: 'Missing Self-Reference',
    description:
      'Pages with hreflang that forget to include themselves in the language list',
    severity: 'warning',
    section: 'hreflang'
  },
  {
    field: 'pages_missing_hreflang_x_default',
    label: 'Missing x-default',
    description:
      'Pages without an x-default hreflang — visitors with unsupported languages may see the wrong version',
    severity: 'warning',
    section: 'hreflang'
  },

  // ── Images ────────────────────────────────────────────────────────────────
  {
    field: 'total_images_missing_alt',
    label: 'Images Missing Alt Text',
    description:
      'Images without alt text — screen readers cannot describe them and search engines cannot understand them',
    severity: 'critical',
    section: 'images'
  },
  {
    field: 'total_images_empty_alt',
    label: 'Images with Empty Alt',
    description:
      'Images with a blank alt attribute — treated as decorative, which may not be intentional',
    severity: 'opportunity',
    section: 'images'
  },
  {
    field: 'total_images_missing_dimensions',
    label: 'Images Missing Dimensions',
    description:
      'Images without width and height attributes, causing layout shift as the page loads',
    severity: 'warning',
    section: 'images'
  },
  {
    field: 'total_images_unoptimized_format',
    label: 'Unoptimised Image Format',
    description:
      'Images not using modern formats like WebP or AVIF that load faster',
    severity: 'opportunity',
    section: 'images'
  },
  {
    field: 'pages_with_images_missing_alt',
    label: 'Pages with Missing Alt Images',
    description: 'Pages containing at least one image without alt text',
    severity: 'warning',
    section: 'images'
  },
  {
    field: 'pages_with_images_empty_alt',
    label: 'Pages with Empty Alt Images',
    description:
      'Pages containing at least one image with a blank alt attribute',
    severity: 'opportunity',
    section: 'images'
  },
  {
    field: 'pages_with_images_missing_dimensions',
    label: 'Pages with Missing Dimension Images',
    description: 'Pages containing at least one image without width/height set',
    severity: 'warning',
    section: 'images'
  },
  {
    field: 'pages_with_unoptimized_image_format',
    label: 'Pages with Unoptimised Images',
    description:
      'Pages containing at least one image in an older format (JPEG, PNG, GIF)',
    severity: 'opportunity',
    section: 'images'
  }
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

const fieldIndex = new Map(ISSUE_REGISTRY.map((d) => [d.field, d]));

export function getIssueByField(field: string): IssueDefinition | undefined {
  return fieldIndex.get(field);
}

export function getIssuesBySection(section: IssueSection): IssueDefinition[] {
  return ISSUE_REGISTRY.filter((d) => d.section === section);
}

// ---------------------------------------------------------------------------
// Component map — replaces the 70-line if/else chain in view-client.tsx
// ---------------------------------------------------------------------------

export const ISSUE_DESCRIPTION_MAP: Record<string, ComponentType> = {
  // Metadata
  pages_missing_title: TitlesMissing,
  too_short_title: TitlesTooShort,
  too_long_title: TitlesTooLong,
  too_long_title_urls: TitlesTooLong, // alias used by some routes
  pages_missing_description: DescriptionsMissing,
  too_short_description: DescriptionsTooShort,
  too_long_description: DescriptionsTooLong,

  // Headings
  pages_missing_h1: Heading1Missing,
  pages_with_multiple_h1s: Heading1Multiple,
  pages_with_duplicate_h1s: Heading1Duplicate,
  pages_missing_h2: Heading2Missing,
  pages_with_multiple_h2s: Heading2Multiple,
  pages_with_duplicate_h2s: Heading2Duplicate,
  pages_missing_h3: Heading3Missing,
  pages_with_multiple_h3s: Heading3Multiple,
  pages_with_duplicate_h3s: Heading3Duplicate,
  pages_missing_h4: Heading4Missing,
  pages_with_multiple_h4s: Heading4Multiple,
  pages_with_duplicate_h4s: Heading4Duplicate,
  pages_missing_h5: Heading5Missing,
  pages_with_multiple_h5s: Heading5Multiple,
  pages_with_duplicate_h5s: Heading5Duplicate,
  pages_missing_h6: Heading6Missing,
  pages_with_multiple_h6s: Heading6Multiple,
  pages_with_duplicate_h6s: Heading6Duplicate,

  // Canonicals
  pages_missing_canonical: MissingCanonical,
  pages_canonicalised: Canonicalised,
  canonical_points_to_redirect: CanonicalPointsToRedirect,
  canonical_points_to_404: CanonicalPointsTo404,
  canonical_points_to_4xx: CanonicalPointsTo4xx,
  canonical_points_to_5xx: CanonicalPointsTo5xx,

  // Internal Links
  total_orphaned_pages: OrphanedPages,
  total_broken_internal_links: BrokenInternalLinks,
  total_redirect_internal_links: RedirectInternalLinks,

  // Hreflang
  pages_hreflang_missing_return_tag: HreflangMissingReturnTag,
  pages_hreflang_broken_links: HreflangBrokenLinks,
  pages_hreflang_missing_self_ref: HreflangMissingSelfRef,
  pages_missing_hreflang_x_default: HreflangMissingXDefault,

  // Images
  total_images_missing_alt: ImagesMissingAlt,
  total_images_empty_alt: ImagesEmptyAlt,
  total_images_missing_dimensions: ImagesMissingDimensions,
  total_images_unoptimized_format: ImagesUnoptimizedFormat,
  pages_with_images_missing_alt: PagesWithImagesMissingAlt,
  pages_with_images_empty_alt: PagesWithImagesEmptyAlt,
  pages_with_images_missing_dimensions: PagesWithImagesMissingDimensions,
  pages_with_unoptimized_image_format: PagesWithUnoptimizedImages,

  // Status codes — 3xx
  pages_301_permanent: Status301Permanent,
  pages_302_temporary: Status302Temporary,
  pages_303_see_other: Status303SeeOther,
  pages_307_temporary: Status307Temporary,
  pages_308_permanent: Status308Permanent,

  // Status codes — 4xx
  pages_401_unauthorized: Status401Unauthorized,
  pages_403_forbidden: Status403Forbidden,
  pages_404_not_found: Status404NotFound,
  pages_405_method_not_allowed: Status405MethodNotAllowed,
  pages_408_timeout: Status408Timeout,
  pages_410_gone: Status410Gone,
  pages_429_rate_limited: Status429RateLimited,

  // Status codes — 5xx
  pages_500_internal_error: Status500InternalError,
  pages_502_bad_gateway: Status502BadGateway,
  pages_503_unavailable: Status503Unavailable,
  pages_504_timeout: Status504Timeout
};

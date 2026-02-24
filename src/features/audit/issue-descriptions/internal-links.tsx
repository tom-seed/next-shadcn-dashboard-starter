export function OrphanedPages() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        Orphaned pages have no internal links pointing to them from other pages
        on your site. This makes them difficult for search engines to discover
        and can hurt their ranking potential.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Fix:</strong> Add internal links from relevant pages to these
        orphaned URLs, or consider removing them if they&apos;re no longer
        needed.
      </p>
    </div>
  );
}

export function BrokenInternalLinks() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        Pages with broken internal links point to URLs that return 4xx or 5xx
        errors. This creates a poor user experience and wastes crawl budget.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Fix:</strong> Update or remove the broken links. If the target
        page was moved, update the link to point to the new URL or set up a
        redirect.
      </p>
    </div>
  );
}

export function RedirectInternalLinks() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        Pages with redirect internal links point to URLs that return 3xx
        redirects. While not critical, this adds unnecessary latency and can
        dilute link equity.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Fix:</strong> Update internal links to point directly to the
        final destination URL instead of the redirecting URL.
      </p>
    </div>
  );
}

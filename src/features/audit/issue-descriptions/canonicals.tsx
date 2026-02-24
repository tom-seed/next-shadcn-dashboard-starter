export function MissingCanonical() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        Pages without a canonical tag. Search engines will choose their own
        canonical based on page content, which may not align with your preferred
        URL structure.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Fix:</strong> Add a self-referencing canonical tag to each page
        to explicitly declare the preferred URL.
      </p>
    </div>
  );
}

export function Canonicalised() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        Pages with a canonical tag pointing to a different URL. This tells
        search engines to index the canonical URL instead of this page.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Note:</strong> Verify this is intentional. If the canonical
        points to the wrong page, your content won&apos;t be indexed.
      </p>
    </div>
  );
}

export function CanonicalPointsToRedirect() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        Pages with a canonical tag pointing to a URL that redirects. This can
        cause confusion for search engines and may result in indexing issues.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Fix:</strong> Update the canonical tag to point directly to the
        final destination URL, not the redirecting URL.
      </p>
    </div>
  );
}

export function CanonicalPointsTo404() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        Pages with a canonical tag pointing to a URL that returns a 404 error.
        This is a critical issue that prevents the page from being indexed.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Fix:</strong> Update the canonical tag to point to a valid,
        accessible URL or make it self-referencing.
      </p>
    </div>
  );
}

export function CanonicalPointsTo4xx() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        Pages with a canonical tag pointing to a URL that returns a 4xx client
        error. Search engines cannot index pages with broken canonicals.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Fix:</strong> Update the canonical tag to point to a valid URL
        that returns a 200 status code.
      </p>
    </div>
  );
}

export function CanonicalPointsTo5xx() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        Pages with a canonical tag pointing to a URL that returns a 5xx server
        error. This indicates the canonical target is currently unavailable.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Fix:</strong> Investigate the server error on the canonical
        target URL and ensure it returns a 200 status code.
      </p>
    </div>
  );
}

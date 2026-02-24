export function HreflangMissingReturnTag() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        Pages with hreflang tags that don&apos;t have corresponding return tags
        on the target pages. For hreflang to work correctly, all referenced
        pages must link back to each other.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Fix:</strong> Ensure all pages in the hreflang set have
        reciprocal hreflang tags pointing back to each other.
      </p>
    </div>
  );
}

export function HreflangBrokenLinks() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        Pages with hreflang tags pointing to URLs that return errors. This can
        confuse search engines about your international targeting.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Fix:</strong> Update hreflang tags to point to valid, accessible
        URLs or remove references to pages that no longer exist.
      </p>
    </div>
  );
}

export function HreflangMissingSelfRef() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        Pages with hreflang tags that don&apos;t include a self-referencing tag.
        Each page should have an hreflang tag pointing to itself.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Fix:</strong> Add a self-referencing hreflang tag to each page
        in the hreflang set (e.g.,{' '}
        <code className='bg-muted rounded px-1'>
          &lt;link rel=&quot;alternate&quot; hreflang=&quot;en&quot;
          href=&quot;current-url&quot; /&gt;
        </code>
        ).
      </p>
    </div>
  );
}

export function HreflangMissingXDefault() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        Pages with hreflang tags but no x-default tag. The x-default tag tells
        search engines which page to show users when no specific language/region
        match is found.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Fix:</strong> Add an{' '}
        <code className='bg-muted rounded px-1'>
          hreflang=&quot;x-default&quot;
        </code>{' '}
        tag pointing to your default or most universal language version.
      </p>
    </div>
  );
}

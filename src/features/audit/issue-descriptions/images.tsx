export function ImagesMissingAlt() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        Images without alt text are inaccessible to screen reader users and
        provide no context to search engines. Alt text is essential for both
        accessibility and SEO.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Fix:</strong> Add descriptive alt text that explains the
        image&apos;s content and purpose. Keep it concise but informative.
      </p>
    </div>
  );
}

export function ImagesEmptyAlt() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        Images with empty alt attributes (alt=&quot;&quot;). While this is valid
        for decorative images, it should only be used intentionally for images
        that add no informational value.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Fix:</strong> If the image conveys meaningful content, add
        descriptive alt text. If it&apos;s purely decorative, the empty alt is
        acceptable.
      </p>
    </div>
  );
}

export function ImagesMissingDimensions() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        Images without explicit width and height attributes can cause layout
        shifts as the page loads, negatively impacting Core Web Vitals (CLS) and
        user experience.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Fix:</strong> Add width and height attributes to image tags, or
        use CSS aspect-ratio to reserve space before the image loads.
      </p>
    </div>
  );
}

export function ImagesUnoptimizedFormat() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        Images using older formats (JPEG, PNG, GIF) instead of modern formats
        like WebP or AVIF. Modern formats provide better compression and faster
        load times.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Fix:</strong> Convert images to WebP or AVIF format with
        appropriate fallbacks for older browsers. Use the{' '}
        <code className='bg-muted rounded px-1'>&lt;picture&gt;</code> element
        for format selection.
      </p>
    </div>
  );
}

export function PagesWithImagesMissingAlt() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        Pages containing one or more images without alt text. These pages have
        accessibility issues and miss SEO opportunities.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Fix:</strong> Review each page and add appropriate alt text to
        all meaningful images.
      </p>
    </div>
  );
}

export function PagesWithImagesEmptyAlt() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        Pages containing images with empty alt attributes. Review these to
        ensure the empty alt is intentional for decorative images only.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Fix:</strong> Add descriptive alt text to images that convey
        meaningful content.
      </p>
    </div>
  );
}

export function PagesWithImagesMissingDimensions() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        Pages with images lacking width and height attributes. This can cause
        Cumulative Layout Shift (CLS) issues.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Fix:</strong> Add explicit dimensions to images or use CSS to
        maintain aspect ratio.
      </p>
    </div>
  );
}

export function PagesWithUnoptimizedImages() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        Pages containing images in non-optimized formats. Converting these to
        modern formats can significantly improve page load speed.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Fix:</strong> Serve images in WebP or AVIF format with
        appropriate fallbacks.
      </p>
    </div>
  );
}

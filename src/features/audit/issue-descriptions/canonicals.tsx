export function MissingCanonical() {
  return (
    <div>
      <p className='text-sm'>
        Pages without canonical tags. Search engines will generate their own
        canonical tags from the page content, which may not be optimal for SEO
        and can lead to lower click-through rates.
      </p>
    </div>
  );
}

export function Canonicalised() {
  return (
    <div>
      <p className='text-sm'>
        Pages with canonical tags. Search engines will generate their own
        canonical tags from the page content, which may not be optimal for SEO
        and can lead to lower click-through rates.
      </p>
    </div>
  );
}

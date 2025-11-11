export function MissingCanonical() {
  return (
    <div>
      <p className='text-sm'>
        Pages without a canonical tag. Search engines like Google will choose
        their own canonical tag based on page content, which may not be optimal
        for SEO and can lead to lower click-through rates.
      </p>
    </div>
  );
}

export function Canonicalised() {
  return (
    <div>
      <p className='text-sm'>
        Pages that have a canonical tag which points to another page. If this is
        incorrect due to an error, your page wont be indexed by search engines.
      </p>
    </div>
  );
}

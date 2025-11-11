export function StatusCodes3xx() {
  return (
    <div>
      <p className='text-sm'>
        Pages with 3xx status codes. Redirects are fine when used correctly, but
        if not, they can cause issues with SEO. Internal redirects should be
        updated with the correct 200 pages.
      </p>
    </div>
  );
}

export function StatusCodes4xx() {
  return (
    <div>
      <p className='text-sm'>
        Pages with 4xx status codes. These should be investigated to understand
        whether a redirect should be put in place
      </p>
    </div>
  );
}

export function StatusCodes5xx() {
  return (
    <div>
      <p className='text-sm'>
        Pages with 5xx status codes. Servers can potentially become overwhelmed
        in high traffic periods, and should be investigated to understand
        whether this is a consistent issue.
      </p>
    </div>
  );
}

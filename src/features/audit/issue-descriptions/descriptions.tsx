export function DescriptionsTooLong() {
  return (
    <div>
      <p className='text-sm'>
        Descriptions that go over the standard length of 165 characters.
        Anything over this number of characters will be truncated by search
        engines and may result in a reduction of CTR.
      </p>
    </div>
  );
}

export function DescriptionsTooShort() {
  return (
    <div>
      <p className='text-sm'>
        Descriptions that go under the standard length of 165 characters.
        Anything under this number of characters will be truncated by search
        engines and may result in a reduction of CTR.
      </p>
    </div>
  );
}

export function DescriptionsMissing() {
  return (
    <div>
      <p className='text-sm'>
        Pages without descriptions. Search engines will generate their own
        descriptions from the page content, which may not be optimal for SEO and
        can lead to lower click-through rates.
      </p>
    </div>
  );
}

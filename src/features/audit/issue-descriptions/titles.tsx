export function TitlesTooLong() {
  return (
    <div>
      <p className='text-sm'>
        Titles that go over the standard length of 65 characters. Anything over
        this number of characters will be truncated by search engines and may
        result in a reduction of CTR.
      </p>
    </div>
  );
}

export function TitlesTooShort() {
  return (
    <div>
      <p className='text-sm'>
        Titles that go under the standard length of 65 characters. Anything
        under this number of characters will not be taking advantage of the full
        potential of keywords.
      </p>
    </div>
  );
}

export function TitlesMissing() {
  return (
    <div>
      <p className='text-sm'>
        Pages without titles. Search engines will generate their own titles from
        the page content, which may not be optimal for SEO and can lead to lower
        click-through rates.
      </p>
    </div>
  );
}

// 3xx Redirects
export function StatusCodes3xx() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        Pages returning 3xx redirect status codes. While redirects are valid,
        excessive internal redirects waste crawl budget and add latency.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Fix:</strong> Update internal links to point directly to final
        destination URLs.
      </p>
    </div>
  );
}

export function Status301Permanent() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        301 Permanent Redirect indicates the page has permanently moved to a new
        URL. Search engines will transfer most link equity to the new URL.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Note:</strong> 301s are the correct choice for permanent URL
        changes. Ensure internal links are updated to the new URL.
      </p>
    </div>
  );
}

export function Status302Temporary() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        302 Found (Temporary Redirect) indicates the page has temporarily moved.
        Search engines may not transfer link equity and may continue indexing
        the original URL.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Fix:</strong> If the move is permanent, change to a 301
        redirect. Only use 302 for genuinely temporary redirects.
      </p>
    </div>
  );
}

export function Status303SeeOther() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        303 See Other redirects the client to a different resource using GET.
        Commonly used after form submissions.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Note:</strong> This is typically expected behavior after POST
        requests. Investigate if appearing unexpectedly.
      </p>
    </div>
  );
}

export function Status307Temporary() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        307 Temporary Redirect preserves the original HTTP method. Similar to
        302 but guarantees the request method won&apos;t change.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Fix:</strong> If the redirect should be permanent, use 308
        instead.
      </p>
    </div>
  );
}

export function Status308Permanent() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        308 Permanent Redirect is like 301 but preserves the HTTP method.
        Commonly used for API endpoints.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Note:</strong> This is the correct choice for permanent
        redirects where method preservation matters.
      </p>
    </div>
  );
}

// 4xx Client Errors
export function StatusCodes4xx() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        Pages returning 4xx client error status codes. These indicate broken
        links or access issues that should be investigated.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Fix:</strong> Update or remove broken links, or implement
        appropriate redirects.
      </p>
    </div>
  );
}

export function Status401Unauthorized() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        401 Unauthorized indicates the page requires authentication. If this
        content should be publicly accessible, authentication may be
        misconfigured.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Fix:</strong> Verify authentication requirements are correct. If
        the page should be public, update access controls.
      </p>
    </div>
  );
}

export function Status403Forbidden() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        403 Forbidden indicates the server understood the request but refuses to
        authorize it. This may indicate permission issues.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Fix:</strong> Check file permissions and access controls. If the
        page should be accessible, update server configuration.
      </p>
    </div>
  );
}

export function Status404NotFound() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        404 Not Found indicates the page doesn&apos;t exist. Internal links to
        404 pages waste crawl budget and create poor user experience.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Fix:</strong> Remove or update links pointing to these URLs, or
        implement redirects to relevant content.
      </p>
    </div>
  );
}

export function Status405MethodNotAllowed() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        405 Method Not Allowed indicates the HTTP method is not supported for
        this URL. This typically occurs when GET requests are not allowed.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Fix:</strong> Verify the endpoint configuration. If this is an
        API endpoint, ensure it&apos;s not linked as a regular page.
      </p>
    </div>
  );
}

export function Status408Timeout() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        408 Request Timeout indicates the server timed out waiting for the
        request. This may indicate server performance issues.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Fix:</strong> Investigate server performance and consider
        increasing timeout limits if appropriate.
      </p>
    </div>
  );
}

export function Status410Gone() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        410 Gone indicates the page has been permanently removed with no
        replacement. Search engines will remove these pages from their index.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Note:</strong> This is the correct status for intentionally
        removed content. Update internal links to remove references.
      </p>
    </div>
  );
}

export function Status429RateLimited() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        429 Too Many Requests indicates the server is rate limiting requests.
        This may affect crawl efficiency.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Fix:</strong> Review rate limiting configuration. Consider
        whitelisting search engine crawlers or adjusting limits.
      </p>
    </div>
  );
}

// 5xx Server Errors
export function StatusCodes5xx() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        Pages returning 5xx server error status codes. These indicate server
        problems that prevent pages from being served.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Fix:</strong> Investigate server logs and resolve underlying
        issues. Server errors can significantly impact SEO.
      </p>
    </div>
  );
}

export function Status500InternalError() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        500 Internal Server Error indicates an unexpected server condition. This
        is a generic error that requires investigation.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Fix:</strong> Check server logs for specific error details.
        Common causes include code errors, database issues, or configuration
        problems.
      </p>
    </div>
  );
}

export function Status502BadGateway() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        502 Bad Gateway indicates an upstream server returned an invalid
        response. This often occurs with proxy or load balancer configurations.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Fix:</strong> Check upstream server health and
        proxy/load-balancer configuration.
      </p>
    </div>
  );
}

export function Status503Unavailable() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        503 Service Unavailable indicates the server is temporarily unable to
        handle requests, often due to maintenance or overload.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Fix:</strong> If persistent, investigate server capacity and
        scaling options.
      </p>
    </div>
  );
}

export function Status504Timeout() {
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        504 Gateway Timeout indicates an upstream server didn&apos;t respond in
        time. This often indicates backend performance issues.
      </p>
      <p className='text-muted-foreground text-sm'>
        <strong>Fix:</strong> Investigate backend performance, database queries,
        or external API dependencies that may be causing delays.
      </p>
    </div>
  );
}

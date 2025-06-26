// src/lib/api/urls.ts

import { Urls } from '@prisma/client'; // Assuming Urls type from Prisma

// Define the expected structure of the API response for URLs
interface PaginatedUrlsResponse {
  urls: Urls[];
  totalCount: number;
  page: number;
  perPage: number;
}

/**
 * Fetches a paginated and filtered list of URLs for a given client.
 * @param clientId The ID of the client.
 * @param page The current page number (1-indexed).
 * @param perPage The number of items per page.
 * @param search A search query to filter URLs by name/URL.
 * @param status A status code to filter URLs by.
 * @returns A promise that resolves to an object containing urls, totalCount, page, and perPage.
 */
export async function getUrls(
  clientId: string,
  page: number = 1,
  perPage: number = 10,
  search: string = '',
  status: string = ''
): Promise<PaginatedUrlsResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const query = new URLSearchParams();

  query.append('page', page.toString());
  query.append('perPage', perPage.toString());
  if (search) query.append('name', search); // 'name' maps to the URL search filter
  if (status) query.append('status', status); // 'status' maps to the status filter

  const res = await fetch(
    `${baseUrl}/api/client/${clientId}/urls?${query.toString()}`,
    {
      cache: 'no-store', // Ensures fresh data on every request
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  if (!res.ok) {
    // Attempt to parse error message from response, or use a default
    const errorData = await res
      .json()
      .catch(() => ({ message: 'Unknown API error' }));
    console.error('API Fetch Error:', errorData);
    // Throw an error to be caught by the calling server component
    throw new Error(
      `Failed to fetch URLs: ${errorData.error || res.statusText}`
    );
  }

  // Ensure the response always matches the expected structure
  let data: PaginatedUrlsResponse = await res.json(); // Use 'let' as we might reassign data

  // --- MODIFIED DEFENSIVE CHECKS TO CLARIFY LOGGING SOURCE ---
  // This condition specifically catches if the entire 'data' object IS the array itself
  if (
    Array.isArray(data) &&
    data.length > 0 &&
    typeof data[0] === 'object' &&
    'url' in data[0]
  ) {
    console.warn(
      `[API_RESPONSE_ERROR] Backend returned a raw array instead of an object with 'urls' property. This is a temporary client-side patch. 
      :`,
      data
    );
    // Treat the received array as 'urls' and infer totalCount from its length
    data = {
      // Reassign data to match expected structured response
      urls: data as unknown as Urls[], // Cast the raw array to Urls[]
      totalCount: data.length, // Infer totalCount from array length
      page: page, // Use current requested page
      perPage: perPage // Use current requested perPage
    };
  } else {
    // Original checks if data.urls or data.totalCount are just malformed
    if (!Array.isArray(data.urls)) {
      console.warn(
        `[API_RESPONSE_ERROR] API response for 'urls' is not an array. Received:`,
        data.urls
      );
      data.urls = [];
    }
    if (typeof data.totalCount !== 'number') {
      console.warn(
        `[API_RESPONSE_ERROR] API response for 'totalCount' is not a number. Received:`,
        data.totalCount
      );
      data.totalCount = 0;
    }
  }
  // --- END MODIFIED DEFENSIVE CHECKS ---

  return data;
}

/**
 * Fetches details for a single URL by its ID.
 * @param clientId The ID of the client the URL belongs to.
 * @param urlId The ID of the URL to fetch.
 * @returns A promise that resolves to the URL details.
 */
export async function getUrlById(
  clientId: string,
  urlId: string
): Promise<Urls> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const res = await fetch(`${baseUrl}/api/client/${clientId}/urls/${urlId}`, {
    headers: {
      'x-client-id': clientId,
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  });

  if (!res.ok) {
    const errorData = await res
      .json()
      .catch(() => ({ message: 'Unknown error' }));
    console.error('API Fetch Error (single URL):', errorData);
    throw new Error(
      `Failed to fetch URL by ID: ${errorData.error || res.statusText}`
    );
  }

  return res.json();
}

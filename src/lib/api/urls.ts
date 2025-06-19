// src/lib/api/urls.ts
export async function getUrls(clientId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const res = await fetch(`${baseUrl}/api/client/${clientId}/urls`, {
    cache: 'no-store'
  });

  if (!res.ok) {
    throw new Error('Failed to fetch URLs');
  }

  return res.json();
}

// lib/api/urls.ts
export async function getUrlById(clientId: string, urlId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const res = await fetch(`${baseUrl}/api/client/${clientId}/urls/${urlId}`, {
    headers: {
      'x-client-id': clientId
    },
    cache: 'no-store'
  });

  if (!res.ok) {
    throw new Error('Failed to fetch URL by ID');
  }

  return res.json();
}

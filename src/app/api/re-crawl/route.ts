import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { clientId, url } = await request.json();

    if (!clientId || !url) {
      return NextResponse.json(
        { error: 'clientId and url are required' },
        { status: 400 }
      );
    }

    const apiResponse = await fetch(
      `${process.env.NEXT_PUBLIC_NODE_API}/re-crawl`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ clientId, url })
      }
    );

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      return NextResponse.json(
        { error: `Failed to re-crawl: ${errorText}` },
        { status: apiResponse.status }
      );
    }

    const data = await apiResponse.json();

    return NextResponse.json(data);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in re-crawl API route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

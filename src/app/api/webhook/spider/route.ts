export async function POST(req: Request) {
  const body = await req.json();
  console.log('🐛 Incoming Spider webhook:', JSON.stringify(body, null, 2));
  return new Response('ok');
}

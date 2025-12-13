export const runtime = 'nodejs';

// This route proxies to the canonical `/api/auth/login` route used by the
// application. Keep the frontend calling `/api/login` safe while centralizing
// auth logic under `/api/auth/*`.
export async function POST(req: Request) {
  // Forward the request to /api/auth/login on the same origin.
  const origin = new URL(req.url).origin;
  const forwardUrl = `${origin}/api/auth/login`;

  const body = await req.text();
  const headers = new Headers(req.headers);
  // Ensure we pass content-type
  if (!headers.get('content-type')) headers.set('content-type', 'application/json');

  const res = await fetch(forwardUrl, {
    method: 'POST',
    headers,
    body,
    // Note: fetch inside Next.js server routes will call the internal route.
  });

  const text = await res.text();
  return new Response(text, { status: res.status, headers: res.headers });
}

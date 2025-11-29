import { NextRequest } from 'next/server';
import { middleware } from '../middleware';

vi.mock('../middleware', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../middleware')>();
  return actual;
});

describe('middleware admin session', () => {
  const buildReq = (url: string, cookies?: Record<string, string>) => {
    const headers = new Headers();
    if (cookies) {
      headers.set(
        'cookie',
        Object.entries(cookies)
          .map(([k, v]) => `${k}=${v}`)
          .join('; ')
      );
    }
    return new NextRequest(new URL(url), { headers });
  };

  it('redirects to login when no token', async () => {
    const res = await middleware(buildReq('http://localhost/admin-panel/analytics'));
    expect(res?.headers.get('location')).toBe('/login');
  });
});

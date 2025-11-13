import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cloneDefaultPermissions } from './src/lib/permissions-config';

function getModuleId(path: string) {
  // support both legacy /dashboard/* and new top-level routes
  if (path.startsWith('/dashboard/indicators') || path.startsWith('/indicators')) return 'indicators';
  if (path.startsWith('/dashboard/releases') || path.startsWith('/releases')) return 'releases';
  if (path.startsWith('/dashboard/incidents') || path.startsWith('/incidents')) return 'incidents';
  if (path.startsWith('/dashboard/rncs') || path.startsWith('/rncs')) return 'rncs';
  if (path.startsWith('/dashboard/categories') || path.startsWith('/categories')) return 'categories';
  if (path.startsWith('/dashboard/matrix') || path.startsWith('/matrix')) return 'matrix';
  if (path.startsWith('/dashboard/compliance') || path.startsWith('/compliance')) return 'compliance';
  if (path.startsWith('/dashboard/suppliers') || path.startsWith('/suppliers')) return 'suppliers';
  if (path.startsWith('/dashboard/warranty') || path.startsWith('/warranty')) return 'warranty';
  if (path.startsWith('/dashboard/tools') || path.startsWith('/tools')) return 'tools';
  if (path.startsWith('/dashboard/vacations') || path.startsWith('/vacations')) return 'vacations';
  if (path.startsWith('/dashboard/settlement') || path.startsWith('/settlement')) return 'settlement';
  if (path.startsWith('/dashboard/profile') || path.startsWith('/profile')) return 'profile';
  if (path.startsWith('/dashboard/settings') || path.startsWith('/settings')) return 'settings';
  if (path.startsWith('/dashboard/admin') || path.startsWith('/admin')) return 'admin';
  return undefined;
}

export function middleware(req: NextRequest) {
  const { nextUrl, cookies } = req;
  const path = nextUrl.pathname;
  if (!path.startsWith('/dashboard')) return NextResponse.next();

  const moduleId = getModuleId(path);
  if (!moduleId) return NextResponse.next();

  // try read role from cookie pm_user (we store small JSON client-side)
  const raw = cookies.get('pm_user')?.value;
  let role = 'visualizador';
  if (raw) {
    try {
      const parsed = JSON.parse(decodeURIComponent(raw));
      if (parsed && parsed.role) role = parsed.role;
    } catch (e) {
      // ignore
    }
  }

  const defaults: any = cloneDefaultPermissions();
  const allowed = Boolean(defaults[role]?.[moduleId]);
  if (allowed) return NextResponse.next();

  // redirect to indicators root if not allowed
  const url = nextUrl.clone();
  url.pathname = '/indicators';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/indicators/:path*',
    '/releases/:path*',
    '/incidents/:path*',
    '/rncs/:path*',
    '/categories/:path*',
    '/matrix/:path*',
    '/compliance/:path*',
    '/vacations/:path*',
    '/suppliers/:path*',
    '/warranty/:path*',
    '/tools/:path*',
    '/settlement/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/admin/:path*',
  ],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cloneDefaultPermissions } from './src/lib/permissions-config';
async function fetchSession(req: NextRequest) {
  const base = req.nextUrl.origin;
  try {
    const res = await fetch(`${base}/api/admin-panel/session`, {
      headers: {
        cookie: req.headers.get('cookie') ?? '',
      },
    });
    return res;
  } catch (e) {
    return null;
  }
}

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
  if (path.startsWith('/admin-panel/audit')) return 'admin-audit';
  if (path.startsWith('/admin-panel/analytics')) return 'admin-analytics';
  if (path.startsWith('/admin-panel/modules')) return 'admin-modules';
  if (path.startsWith('/admin-panel/users')) return 'admin-users';
  if (path.startsWith('/admin-panel/config')) return 'admin-config';
  if (path.startsWith('/admin-panel/health')) return 'admin-health';
  if (path.startsWith('/admin-panel')) return 'admin-dashboard';
  return undefined;
}

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const path = nextUrl.pathname;
  // allow public/internal asset routes to pass through
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.startsWith('/static') ||
    path.startsWith('/public') ||
    path === '/favicon.ico' ||
    path.startsWith('/_static')
  ) {
    return NextResponse.next();
  }

  // allow explicit auth pages
  if (path === '/login' || path.startsWith('/(auth)') || path.startsWith('/auth')) {
    return NextResponse.next();
  }

  const moduleId = getModuleId(path);
  const isAdminRoute = path.startsWith('/admin-panel');

  if (isAdminRoute) {
    const sessionRes = await fetchSession(req);
    if (!sessionRes || sessionRes.status === 401) {
      const url = nextUrl.clone();
      url.pathname = '/login';
      try { url.searchParams.set('returnTo', path); } catch (e) {}
      return NextResponse.redirect(url);
    }
    if (sessionRes.status === 403) {
      const url = nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
    let sessionJson: any = null;
    try {
      sessionJson = await sessionRes.json();
    } catch (e) {
      sessionJson = null;
    }
    if (moduleId && sessionJson) {
      const allowed = Boolean(sessionJson.permissions?.[moduleId]);
      const active = sessionJson.activeModules?.[moduleId] !== false;
      if (!allowed || !active) {
        const url = nextUrl.clone();
        url.pathname = '/indicators';
        return NextResponse.redirect(url);
      }
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/:path*',
  ],
};

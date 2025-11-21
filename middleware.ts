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

  // Accept presence of any of these cookies as authentication proof.
  const pmRaw = cookies.get('pm_user')?.value;
  const sessionRaw = cookies.get('session')?.value;
  const nextAuthRaw = cookies.get('next-auth.session-token')?.value;
  if (!pmRaw && !sessionRaw && !nextAuthRaw) {
    // Debug log to help diagnose duplicate /login requests in dev
    try {
      // eslint-disable-next-line no-console
      console.log('[middleware] unauthenticated request', { path, cookie: cookies.get('pm_user')?.value ? 'pm_user' : (cookies.get('session')?.value ? 'session' : (cookies.get('next-auth.session-token')?.value ? 'next-auth' : 'none')) });
    } catch (e) {}
    const url = nextUrl.clone();
    url.pathname = '/login';
    // preserve the originally requested path so the app can navigate back after login
    try { url.searchParams.set('returnTo', path); } catch (e) {}
    return NextResponse.redirect(url);
  }
  // Development-only debug: log which cookie is being used to allow access.
  try {
    if (process.env.NODE_ENV !== 'production') {
      let used = 'none';
      let parsedRole: string | undefined = undefined;
      if (pmRaw) {
        used = 'pm_user';
        try {
          const parsed = JSON.parse(decodeURIComponent(pmRaw));
          parsedRole = parsed?.role;
        } catch (e) {
          parsedRole = 'malformed';
        }
      } else if (sessionRaw) {
        used = 'session';
      } else if (nextAuthRaw) {
        used = 'next-auth.session-token';
      }
      // eslint-disable-next-line no-console
      console.log('[middleware] authenticated request', { path, used, role: parsedRole ?? null });
    }
  } catch (e) {
    // ignore logging errors
  }

  // If pm_user is present, try parse role for permission checks. If not present
  // we treat the request as authenticated (server session may be available),
  // but skip module-level permission enforcement since we can't derive role here.
  let role = 'visualizador';
  let hasPm = false;
  if (pmRaw) {
    try {
      const parsed = JSON.parse(decodeURIComponent(pmRaw));
      // if parsing succeeds and we have an id, treat as pm_user present
      if (parsed && (parsed.id || parsed.role)) {
        hasPm = true;
        if (parsed.role) role = parsed.role;
      } else {
        // malformed pm_user: treat as not authenticated
        const url = nextUrl.clone();
        url.pathname = '/login';
        try { url.searchParams.set('returnTo', path); } catch (e) {}
        return NextResponse.redirect(url);
      }
    } catch (e) {
      // malformed cookie content - treat as unauthenticated
      const url = nextUrl.clone();
      url.pathname = '/login';
      try { url.searchParams.set('returnTo', path); } catch (e) {}
      return NextResponse.redirect(url);
    }
  }

  // enforce module-level permissions for known module paths
  const moduleId = getModuleId(path);
  if (moduleId && hasPm) {
    const defaults: any = cloneDefaultPermissions();
    const allowed = Boolean(defaults[role]?.[moduleId]);
    if (!allowed) {
      const url = nextUrl.clone();
      url.pathname = '/indicators';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/:path*',
  ],
};

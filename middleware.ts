import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cloneDefaultPermissions } from './src/lib/permissions-config';
import { verifyAccessToken } from './src/lib/auth/jwt';

const IDLE_SESSION_TIMEOUT_SECONDS = Number(process.env.IDLE_SESSION_TIMEOUT_SECONDS ?? 0);

function attachLastActiveCookie(res: NextResponse, nowSec?: number) {
  if (!IDLE_SESSION_TIMEOUT_SECONDS) return res;
  const now = nowSec ?? Math.floor(Date.now() / 1000);
  res.cookies.set('pm_last_active', String(now), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: IDLE_SESSION_TIMEOUT_SECONDS,
  });
  return res;
}

function clearAuthCookies(res: NextResponse) {
  const opts = { path: '/', maxAge: 0 } as any;
  res.cookies.set('pm_access_token', '', opts);
  res.cookies.set('pm_refresh_token', '', opts);
  res.cookies.set('pm_user', '', opts);
  res.cookies.set('pm_last_active', '', opts);
  return res;
}

function extractAccessToken(req: NextRequest) {
  const cookieToken = req.cookies.get('pm_access_token')?.value;
  const headerToken = req.headers.get('authorization')?.replace('Bearer ', '');
  return cookieToken ?? headerToken ?? null;
}
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
  if (path.startsWith('/admin-panel/integrations')) return 'admin-integrations';
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
    path.startsWith('/static') ||
    path.startsWith('/public') ||
    path === '/favicon.ico' ||
    path.startsWith('/_static')
  ) {
    return NextResponse.next();
  }

  const isApiRoute = path.startsWith('/api');
  const PUBLIC_API_EXACT = new Set([
    '/api/auth/login',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/refresh',
    '/api/admin-panel/auth/login',
    '/api/admin-panel/auth/refresh',
    '/api/admin-panel/auth/logout',
    '/api/dev/login-as-admin',
    '/api/whoami',
  ]);
  const PUBLIC_API_PREFIXES = ['/api/health'];
  const isPublicApiRoute = isApiRoute && (
    PUBLIC_API_EXACT.has(path) ||
    PUBLIC_API_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`))
  );

  if (isApiRoute) {
    if (isPublicApiRoute) {
      return NextResponse.next();
    }
    const accessToken = extractAccessToken(req);
    const verified = verifyAccessToken(accessToken);
    if (!verified.valid) {
      return NextResponse.json({ message: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // allow explicit auth pages / auth helpers
  const isPublicRoute = (
    path === '/login' ||
    path === '/request-account' ||
    path === '/forgot-password' ||
    path === '/signup' ||
    path === '/reset-password' ||
    path.startsWith('/(auth)') ||
    path.startsWith('/auth')
  );
  if (isPublicRoute) {
    return NextResponse.next();
  }

  const accessToken = extractAccessToken(req);
  const tokenValid = accessToken ? verifyAccessToken(accessToken).valid : false;
  if (!tokenValid) {
    const url = nextUrl.clone();
    url.pathname = '/login';
    try { url.searchParams.set('returnTo', path); } catch (e) {}
    return NextResponse.redirect(url);
  }

  // Idle-session check: if enabled and last active exceeds timeout, force logout
  if (IDLE_SESSION_TIMEOUT_SECONDS) {
    const lastActive = Number(req.cookies.get('pm_last_active')?.value || '0');
    const now = Math.floor(Date.now() / 1000);
    if (lastActive && now - lastActive > IDLE_SESSION_TIMEOUT_SECONDS) {
      const url = nextUrl.clone();
      url.pathname = '/login';
      try { url.searchParams.set('returnTo', path); } catch (e) {}
      const res = NextResponse.redirect(url);
      clearAuthCookies(res);
      return res;
    }
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
    return attachLastActiveCookie(NextResponse.next());
  }

  return attachLastActiveCookie(NextResponse.next());
}

export const config = {
  matcher: [
    '/:path*',
  ],
};

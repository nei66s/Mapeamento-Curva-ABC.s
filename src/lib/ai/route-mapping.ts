export const routeMap: Record<string, string> = {
  escopos: '/escopos',
  escopo: '/escopos',
  dashboard: '/dashboard',
  ativos: '/assets',
  asset: '/assets',
  categorias: '/categories',
  categorias_plural: '/categories',
  admin: '/admin-panel',
  perfil: '/dashboard/profile',
};

export function findRouteForKeyword(keyword: string) {
  if (!keyword) return undefined;
  const key = keyword.toLowerCase().trim();
  return routeMap[key] ?? undefined;
}

export const appRoutes: string[] = Array.from(new Set([
  '/',
  '/ai-assistant',
  '/dashboard',
  '/assets',
  '/categories',
  '/admin-panel',
  '/escopos',
  '/dashboard/profile',
]));

// Normalize known alternative routes to canonical internal routes.
const reverseMap: Record<string, string> = {
  '/categories/scopes': '/escopos',
};

export function normalizeRoute(route?: string) {
  if (!route) return route;
  let r = route.trim();

  // strip surrounding quotes
  r = r.replace(/^['"`]+|['"`]+$/g, '');

  // If the route is an absolute URL or protocol-relative (//host/path),
  // extract only the path portion so router.push gets an internal route.
  try {
    if (/^https?:\/\//i.test(r) || r.startsWith('//')) {
      const base = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost';
      const u = new URL(r, base);
      r = (u.pathname || '/') + (u.search || '') + (u.hash || '');
    }
  } catch (e) {
    // ignore parse errors and fall back to raw route
  }

  // Remove trailing punctuation commonly added by sentences (.,;:!?)
  r = r.replace(/[.,;:!?]+$/g, '');

  r = r.trim();
  return reverseMap[r] ?? r;
}

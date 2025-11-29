import { NextResponse } from 'next/server';
import { getModuleByKey } from '@/server/adapters/modules-adapter';

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function parsePagination(searchParams: URLSearchParams, defaultSize = 20) {
  const page = Number(searchParams.get('page') || 1);
  const pageSize = Number(searchParams.get('pageSize') || defaultSize);
  return {
    page: page > 0 ? page : 1,
    pageSize: pageSize > 0 ? pageSize : defaultSize,
  };
}

export function getRequestIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0].trim();
  return forwarded || request.headers.get('x-real-ip') || '0.0.0.0';
}

// Check module activation using the modules adapter. Returns `true` when the
// module exists and `is_active` is truthy. This is async because it queries DB.
export async function isModuleActive(key: string) {
  try {
    // In-memory cache to avoid DB hits on frequently-called routes.
    // Cache key is the module key string; value stores boolean and expiry timestamp.
    const TTL_SECONDS = Number(process.env.ADMIN_MODULE_CACHE_TTL_SEC || '30');
    type CacheEntry = { value: boolean; expiresAt: number };
    // keep cache in module scope
    if (!(globalThis as any).__adminModuleCache) {
      (globalThis as any).__adminModuleCache = new Map<string, CacheEntry>();
    }
    const cache: Map<string, CacheEntry> = (globalThis as any).__adminModuleCache;

    const now = Date.now();
    const cached = cache.get(key);
    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    // Try the exact key, then fallback to common variants (strip `admin-` prefix)
    let mod = await getModuleByKey(key);
    if (!mod && key.startsWith('admin-')) {
      const alt = key.replace(/^admin-/, '');
      mod = await getModuleByKey(alt);
    }
    const active = !!(mod && mod.is_active);
    cache.set(key, { value: active, expiresAt: now + TTL_SECONDS * 1000 });
    return active;
  } catch (e) {
    console.warn('[isModuleActive] error checking module', key, e);
    return false;
  }
}

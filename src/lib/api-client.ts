import { appConfig } from './config';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './auth/tokens';

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type RequestOptions<TBody = unknown> = {
  method?: HttpMethod;
  body?: TBody;
  headers?: Record<string, string>;
  auth?: boolean;
  cache?: RequestCache;
  next?: { revalidate?: number; tags?: string[] };
  signal?: AbortSignal;
  revalidate?: number | false;
  query?: Record<string, string | number | boolean | undefined>;
};

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${appConfig.apiBaseUrl}${appConfig.auth.refreshEndpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.accessToken) {
      setTokens(data.accessToken, data.refreshToken ?? refreshToken, data.expiresIn);
      return data.accessToken as string;
    }
  } catch (e) {
    return null;
  }
  return null;
}

function buildUrl(path: string, query?: Record<string, string | number | boolean | undefined>) {
  const base = path.startsWith('http') ? path : `${appConfig.apiBaseUrl}${path}`;
  if (!query) return base;
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export async function apiFetch<TResponse, TBody = unknown>(path: string, opts: RequestOptions<TBody> = {}): Promise<TResponse> {
  const {
    method = 'GET',
    body,
    headers = {},
    auth = true,
    cache = 'no-store',
    signal,
    query,
    next,
    revalidate,
  } = opts;

  const url = buildUrl(path, query);
  const mergedHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (auth) {
    const token = getAccessToken();
    if (token) mergedHeaders.Authorization = `Bearer ${token}`;
  }

  const requestInit: RequestInit & { next?: { revalidate?: number; tags?: string[] } } = {
    method,
    headers: mergedHeaders,
    cache,
    // Ensure cookies (including HttpOnly tokens set by the server) are sent
    // with API requests. This covers same-origin and cross-origin dev setups.
    credentials: 'include',
    signal,
  };

  if (body !== undefined && method !== 'GET') {
    requestInit.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  if (next) requestInit.next = next;
  if (typeof revalidate === 'number') requestInit.next = { ...(next || {}), revalidate };

  let response = await fetch(url, requestInit);

  if (response.status === 401 && auth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      mergedHeaders.Authorization = `Bearer ${refreshed}`;
      response = await fetch(url, { ...requestInit, headers: mergedHeaders });
    } else {
      clearTokens();
    }
  }

  if (!response.ok) {
    let details: unknown;
    try {
      details = await response.json();
    } catch (e) {
      details = await response.text();
    }
    throw new ApiError(response.status, (details as any)?.message || response.statusText, details);
  }

  const text = await response.text();
  if (!text) return {} as TResponse;
  try {
    return JSON.parse(text) as TResponse;
  } catch (e) {
    return text as unknown as TResponse;
  }
}

export const apiClient = {
  get: <T>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
    apiFetch<T>(path, { ...options, method: 'GET' }),
  post: <T, B = unknown>(path: string, body?: B, options: Omit<RequestOptions<B>, 'method'> = {}) =>
    apiFetch<T, B>(path, { ...options, method: 'POST', body }),
  put: <T, B = unknown>(path: string, body?: B, options: Omit<RequestOptions<B>, 'method'> = {}) =>
    apiFetch<T, B>(path, { ...options, method: 'PUT', body }),
  patch: <T, B = unknown>(path: string, body?: B, options: Omit<RequestOptions<B>, 'method'> = {}) =>
    apiFetch<T, B>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
    apiFetch<T>(path, { ...options, method: 'DELETE' }),
};

import Cookies from 'js-cookie';
import { appConfig } from '../config';
import type { SessionUser } from '@/types/admin';

let inMemoryAccessToken: string | null = null;

const baseCookieOptions = {
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

export function getAccessToken() {
  if (inMemoryAccessToken) return inMemoryAccessToken;
  const cookieToken = Cookies.get(appConfig.auth.accessTokenCookie);
  return cookieToken || null;
}

export function getRefreshToken() {
  // Refresh token should be stored server-side as HttpOnly cookie.
  // Client JS must not read it.
  return null;
}

export function setTokens(accessToken: string, refreshToken?: string, expiresInSeconds?: number) {
  inMemoryAccessToken = accessToken;
  Cookies.set(appConfig.auth.accessTokenCookie, accessToken, {
    ...baseCookieOptions,
    expires: expiresInSeconds ? expiresInSeconds / 86400 : 0.125, // default 3h
  });
  // Do not persist refresh tokens in JS-accessible cookies.
}

export function clearTokens() {
  inMemoryAccessToken = null;
  Cookies.remove(appConfig.auth.accessTokenCookie, { path: '/' });
  // Refresh token is HttpOnly; clear via /api/auth/logout.
}

export function persistSessionUser(user: SessionUser | null) {
  try {
    if (typeof window === 'undefined') return;
    if (user) {
      try {
        localStorage.setItem('pm_user', JSON.stringify(user));
      } catch (e) {
        // ignore localStorage write errors
      }
      try {
        window.dispatchEvent(new CustomEvent('pm_user_changed', { detail: user }));
      } catch (e) {
        // ignore
      }
      return;
    }

    // clear stored user
    try {
      localStorage.removeItem('pm_user');
    } catch (e) {
      // ignore
    }
    try {
      window.dispatchEvent(new CustomEvent('pm_user_changed', { detail: null }));
    } catch (e) {
      // ignore
    }
  } catch (err) {
    // guard overall
  }
}

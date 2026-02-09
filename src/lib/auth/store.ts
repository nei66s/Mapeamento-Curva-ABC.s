import { create } from 'zustand';
import type { SessionUser } from '@/types/admin';
import { AuthService } from '@/services/auth-service';
import { clearTokens, getRefreshToken, getAccessToken, setTokens, persistSessionUser } from './tokens';

type AuthStatus = 'idle' | 'authenticating' | 'authenticated' | 'unauthenticated';

type AuthState = {
  user: SessionUser | null;
  status: AuthStatus;
  bootstrap: () => Promise<SessionUser | null>;
  login: (email: string, password: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<string | null>;
  setUser: (user: SessionUser | null) => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: 'idle',
  async bootstrap() {
    if (get().status !== 'idle') return get().user;
    // If running in the browser, try to hydrate user from localStorage first
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('pm_user');
        if (raw) {
          try {
            const parsed = JSON.parse(raw as string);
            set({ user: parsed });
          } catch (e) {
            // ignore parse errors
          }
        }
      } catch (e) {
        // ignore localStorage access errors
      }
    }
    set({ status: 'authenticating' });
    try {
      // log client-visible tokens for debugging (note: HttpOnly cookies won't be visible here)
      console.debug('[auth-store] bootstrap start, client tokens:', { accessTokenClient: getAccessToken?.() ?? null, refreshTokenClient: getRefreshToken?.() ?? null });
    } catch (e) {
      // ignore logging errors
    }
    try {
      const me = await AuthService.me();
      set({ user: me, status: 'authenticated' });
      persistSessionUser(me);
      return me;
    } catch (e) {
      console.debug('[auth-store] bootstrap failed: ', (e as any)?.message ?? e);
      // If initial /me check fails, try to refresh tokens before giving up.
      try {
        const refreshed = await get().refresh();
        if (refreshed) {
          const me2 = await AuthService.me();
          set({ user: me2, status: 'authenticated' });
          persistSessionUser(me2);
          return me2;
        }
      } catch (e2) {
        console.debug('[auth-store] bootstrap refresh failed: ', (e2 as any)?.message ?? e2);
      }
      // Keep behavior: mark unauthenticated so RequirePermission can redirect.
      set({ user: null, status: 'unauthenticated' });
      return null;
    }
  },
  async login(email: string, password: string) {
    set({ status: 'authenticating' });
    const { user, accessToken, refreshToken, expiresIn } = await AuthService.login(email, password);
    setTokens(accessToken, refreshToken, expiresIn);
    persistSessionUser(user);
    set({ user, status: 'authenticated' });
    return user;
  },
  async logout() {
    try {
      await AuthService.logout();
    } catch (e) {
      // ignore best-effort logout
    }
    clearTokens();
    persistSessionUser(null);
    set({ user: null, status: 'unauthenticated' });
  },
  async refresh() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      set({ status: 'unauthenticated', user: null });
      return null;
    }
    const res = await AuthService.refresh(refreshToken);
    if (!res?.accessToken) {
      clearTokens();
      persistSessionUser(null);
      set({ status: 'unauthenticated', user: null });
      return null;
    }
    setTokens(res.accessToken, res.refreshToken ?? refreshToken, res.expiresIn);
    if (res.user) {
      set({ user: res.user, status: 'authenticated' });
      persistSessionUser(res.user);
    }
    return res.accessToken;
  },
  setUser(user) {
    set({ user });
    persistSessionUser(user);
  },
}));

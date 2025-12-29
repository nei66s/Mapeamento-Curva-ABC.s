import { create } from 'zustand';
import type { SessionUser } from '@/types/admin';
import { AuthService } from '@/services/auth-service';
import { clearTokens, setTokens, persistSessionUser } from './tokens';

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
    set({ status: 'authenticating' });
    try {
      const me = await AuthService.me();
      set({ user: me, status: 'authenticated' });
      persistSessionUser(me);
      return me;
    } catch (e) {
      set({ user: null, status: 'unauthenticated' });
      return null;
    }
  },
  async login(email: string, password: string) {
    set({ status: 'authenticating' });
    const { user, accessToken, refreshToken, expiresIn } = await AuthService.login(email, password);
    setTokens(accessToken, undefined, expiresIn);
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
    const res = await AuthService.refresh();
    if (!res?.accessToken) {
      clearTokens();
      persistSessionUser(null);
      set({ status: 'unauthenticated', user: null });
      return null;
    }
    setTokens(res.accessToken, undefined, res.expiresIn);
    return res.accessToken;
  },
  setUser(user) {
    set({ user });
    persistSessionUser(user);
  },
}));

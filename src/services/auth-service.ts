import { apiClient } from '@/lib/api-client';
import type { SessionUser } from '@/types/admin';

export type LoginResponse = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  user: SessionUser;
};

export type RefreshResponse = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
};

export const AuthService = {
  login: (email: string, password: string) =>
    apiClient.post<LoginResponse>('/auth/login', { email, password }, { auth: false }),
  refresh: () =>
    apiClient.post<RefreshResponse, Record<string, never>>('/auth/refresh', {}, { auth: false }),
  me: () => apiClient.get<SessionUser>('/auth/me'),
  logout: () => apiClient.post<void>('/auth/logout', {}),
};

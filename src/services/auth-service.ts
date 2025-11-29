import { apiClient } from '@/lib/api-client';
import type { SessionUser } from '@/types/admin';

export type LoginResponse = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  user: SessionUser;
};

export const AuthService = {
  login: (email: string, password: string) =>
    apiClient.post<LoginResponse>('/auth/login', { email, password }, { auth: false }),
  refresh: (refreshToken: string) =>
    apiClient.post<LoginResponse>('/auth/refresh', { refreshToken }, { auth: false }),
  me: () => apiClient.get<SessionUser>('/auth/me'),
  logout: () => apiClient.post<void>('/auth/logout', {}),
};

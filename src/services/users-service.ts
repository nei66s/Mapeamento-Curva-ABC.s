import { apiClient } from '@/lib/api-client';
import type { AdminUser, Paginated, AuditLog, UserStatus } from '@/types/admin';
import type { UserRole } from '@/lib/types';

export type UserFilters = {
  email?: string;
  status?: UserStatus;
  role?: UserRole;
  page?: number;
  pageSize?: number;
};

export type SaveUserInput = {
  name: string;
  email: string;
  role: UserRole;
  status?: UserStatus;
  password?: string;
  avatarUrl?: string;
};

export const UsersService = {
  list: (filters: UserFilters = {}) =>
    apiClient.get<Paginated<AdminUser>>('/admin/users', { query: filters }),
  get: (id: string) => apiClient.get<AdminUser>(`/admin/users/${id}`),
  create: (input: SaveUserInput) => apiClient.post<AdminUser>('/admin/users', input),
  update: (id: string, input: Partial<SaveUserInput>) =>
    apiClient.put<AdminUser>(`/admin/users/${id}`, input),
  toggleStatus: (id: string, status: UserStatus, reason?: string) =>
    apiClient.post<AdminUser>(`/admin/users/${id}/status`, { status, reason }),
  resetPassword: (id: string) => apiClient.post<void>(`/admin/users/${id}/reset-password`, {}),
  auditTrail: (id: string) => apiClient.get<AuditLog[]>(`/admin/users/${id}/audit`),
};

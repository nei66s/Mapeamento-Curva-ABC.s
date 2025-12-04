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
  list: async (filters: UserFilters = {}) => {
    const res = await apiClient.get<any>('/admin/users', { query: filters });
    // Normalize server response to `Paginated<AdminUser>`: { items, total, page, pageSize }
    if (!res) return { items: [], total: 0, page: 1, pageSize: 0 } as Paginated<AdminUser>;
    const payload = res.result ?? res;
    // If API returned a plain array
    if (Array.isArray(payload)) {
      const items = payload as AdminUser[];
      return { items, total: items.length, page: 1, pageSize: items.length } as Paginated<AdminUser>;
    }
    // If payload already matches Paginated shape
    if (payload.items && (typeof payload.total === 'number' || typeof payload.count === 'number')) {
      const items: AdminUser[] = payload.items ?? payload.rows ?? [];
      const total: number = payload.total ?? payload.count ?? items.length;
      const page: number = Number(filters.page ?? payload.page ?? 1) || 1;
      const pageSize: number = Number(filters.pageSize ?? payload.pageSize ?? items.length) || items.length;
      return { items, total, page, pageSize } as Paginated<AdminUser>;
    }
    // fallback: map common fields
    const items: AdminUser[] = payload.rows ?? payload.items ?? [];
    const total: number = payload.count ?? payload.total ?? (Array.isArray(items) ? items.length : 0);
    const page: number = Number(filters.page ?? payload.page ?? 1) || 1;
    const pageSize: number = Number(filters.pageSize ?? payload.pageSize ?? items.length) || items.length;
    return { items, total, page, pageSize } as Paginated<AdminUser>;
  },
  get: (id: string) => apiClient.get<AdminUser>(`/admin/users/${id}`),
  create: (input: SaveUserInput) => apiClient.post<AdminUser>('/admin/users', input),
  update: (id: string, input: Partial<SaveUserInput>) =>
    apiClient.put<AdminUser>(`/admin/users/${id}`, input),
  toggleStatus: (id: string, status: UserStatus, reason?: string) =>
    apiClient.post<AdminUser>(`/admin/users/${id}/status`, { status, reason }),
  resetPassword: (id: string) => apiClient.post<void>(`/admin/users/${id}/reset-password`, {}),
  auditTrail: (id: string) => apiClient.get<AuditLog[]>(`/admin/users/${id}/audit`),
};

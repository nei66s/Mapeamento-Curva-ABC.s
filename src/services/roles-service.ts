import { apiClient } from '@/lib/api-client';
import type { Role, Permission } from '@/types/admin';

export type SaveRoleInput = {
  name: string;
  description?: string;
  permissions: Permission[];
};

export const RolesService = {
  list: async () => {
    const res = await apiClient.get<any>('/admin/roles');
    const payload = res?.result ?? res;
    if (Array.isArray(payload)) return payload as Role[];
    if (payload.items) return payload.items as Role[];
    return payload.rows ?? [];
  },
  create: (input: SaveRoleInput) => apiClient.post<Role>('/admin/roles', input),
  update: (id: string, input: Partial<SaveRoleInput>) => apiClient.put<Role>(`/admin/roles/${id}`, input),
  remove: (id: string) => apiClient.delete<void>(`/admin/roles/${id}`),
  assignPermissions: (id: string, permissions: Permission[]) =>
    apiClient.post<Role>(`/admin/roles/${id}/permissions`, { permissions }),
};

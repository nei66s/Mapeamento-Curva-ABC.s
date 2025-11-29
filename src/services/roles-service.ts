import { apiClient } from '@/lib/api-client';
import type { Role, Permission } from '@/types/admin';

export type SaveRoleInput = {
  name: string;
  description?: string;
  permissions: Permission[];
};

export const RolesService = {
  list: () => apiClient.get<Role[]>('/admin/roles'),
  create: (input: SaveRoleInput) => apiClient.post<Role>('/admin/roles', input),
  update: (id: string, input: Partial<SaveRoleInput>) => apiClient.put<Role>(`/admin/roles/${id}`, input),
  remove: (id: string) => apiClient.delete<void>(`/admin/roles/${id}`),
  assignPermissions: (id: string, permissions: Permission[]) =>
    apiClient.post<Role>(`/admin/roles/${id}/permissions`, { permissions }),
};

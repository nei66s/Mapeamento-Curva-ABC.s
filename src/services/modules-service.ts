import { apiClient } from '@/lib/api-client';
import type { FeatureModule, FeatureFlag } from '@/types/admin';

export type ModuleUpdateInput = Partial<Omit<FeatureModule, 'id'>>;

export const ModulesService = {
  list: () => apiClient.get<FeatureModule[]>('/admin/modules'),
  update: (id: string, input: ModuleUpdateInput) => apiClient.put<FeatureModule>(`/admin/modules/${id}`, input),
  setActive: (id: string, active: boolean) => apiClient.post<FeatureModule>(`/admin/modules/${id}/status`, { active }),
  setVisible: (id: string, visibleInMenu: boolean) =>
    apiClient.post<FeatureModule>(`/admin/modules/${id}/visibility`, { visibleInMenu }),
  markBeta: (id: string, beta: boolean) => apiClient.post<FeatureModule>(`/admin/modules/${id}/beta`, { beta }),
  flags: () => apiClient.get<FeatureFlag[]>('/admin/flags'),
  updateFlag: (key: string, enabled: boolean) => apiClient.post<FeatureFlag>(`/admin/flags/${key}`, { enabled }),
};

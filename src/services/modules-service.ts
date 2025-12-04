import { apiClient } from '@/lib/api-client';
import type { FeatureModule, FeatureFlag } from '@/types/admin';

export type ModuleUpdateInput = Partial<Omit<FeatureModule, 'id'>>;

export const ModulesService = {
  // API returns { ok, result } shape; unwrap to return the array the UI expects.
  list: async () => {
    const res = await apiClient.get<any>('/admin/modules');
    return (res && (res.result || res)) as FeatureModule[];
  },
  update: async (id: string, input: ModuleUpdateInput) => {
    const res = await apiClient.put<any>(`/admin/modules/${id}`, input);
    return (res && (res.result || res)) as FeatureModule;
  },
  setActive: async (id: string, active: boolean) => {
    const res = await apiClient.post<any>(`/admin/modules/${id}/status`, { active });
    return (res && (res.result || res)) as FeatureModule;
  },
  setVisible: async (id: string, visibleInMenu: boolean) => {
    const res = await apiClient.post<any>(`/admin/modules/${id}/visibility`, { visibleInMenu });
    return (res && (res.result || res)) as FeatureModule;
  },
  markBeta: async (id: string, beta: boolean) => {
    const res = await apiClient.post<any>(`/admin/modules/${id}/beta`, { beta });
    return (res && (res.result || res)) as FeatureModule;
  },
  // The list-of-flags endpoint lives under /admin-panel/flags; call that and unwrap.
  flags: async () => {
    const res = await apiClient.get<any>('/admin-panel/flags');
    return (res && (res.result || res)) as FeatureFlag[];
  },
  updateFlag: async (key: string, enabled: boolean) => {
    const res = await apiClient.post<any>(`/admin/flags/${key}`, { enabled });
    return (res && (res.result || res)) as FeatureFlag;
  },
};

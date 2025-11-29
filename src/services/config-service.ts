import { apiClient } from '@/lib/api-client';
import type { MonitoringConfig, SecurityConfig, SystemConfig } from '@/types/admin';

export const ConfigService = {
  get: () => apiClient.get<SystemConfig>('/config'),
  update: (config: Partial<SystemConfig>) => apiClient.put<SystemConfig>('/config', config),
  updateSecurity: (security: SecurityConfig) =>
    apiClient.post<SystemConfig>('/config/security', { security }),
  updateMonitoring: (monitoring: MonitoringConfig) =>
    apiClient.post<SystemConfig>('/config/monitoring', { monitoring }),
};

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ConfigService } from '@/services/config-service';
import type { MonitoringConfig, SecurityConfig, SystemConfig } from '@/types/admin';

export function useSystemConfig() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['system-config'],
    queryFn: ConfigService.get,
  });

  const update = useMutation({
    mutationKey: ['system-config', 'update'],
    mutationFn: (config: Partial<SystemConfig>) => ConfigService.update(config),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['system-config'] }),
  });

  const updateSecurity = useMutation({
    mutationKey: ['system-config', 'security'],
    mutationFn: (security: SecurityConfig) => ConfigService.updateSecurity(security),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['system-config'] }),
  });

  const updateMonitoring = useMutation({
    mutationKey: ['system-config', 'monitoring'],
    mutationFn: (monitoring: MonitoringConfig) => ConfigService.updateMonitoring(monitoring),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['system-config'] }),
  });

  return { query, update, updateSecurity, updateMonitoring };
}

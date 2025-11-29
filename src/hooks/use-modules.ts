'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ModulesService, type ModuleUpdateInput } from '@/services/modules-service';

export function useModules() {
  const queryClient = useQueryClient();

  const modules = useQuery({
    queryKey: ['modules'],
    queryFn: ModulesService.list,
  });

  const flags = useQuery({
    queryKey: ['feature-flags'],
    queryFn: ModulesService.flags,
  });

  const updateModule = useMutation({
    mutationKey: ['modules', 'update'],
    mutationFn: ({ id, data }: { id: string; data: ModuleUpdateInput }) => ModulesService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['modules'] }),
  });

  const setActive = useMutation({
    mutationKey: ['modules', 'set-active'],
    mutationFn: ({ id, active }: { id: string; active: boolean }) => ModulesService.setActive(id, active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['modules'] }),
  });

  const setVisible = useMutation({
    mutationKey: ['modules', 'set-visible'],
    mutationFn: ({ id, visible }: { id: string; visible: boolean }) =>
      ModulesService.setVisible(id, visible),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['modules'] }),
  });

  const markBeta = useMutation({
    mutationKey: ['modules', 'mark-beta'],
    mutationFn: ({ id, beta }: { id: string; beta: boolean }) => ModulesService.markBeta(id, beta),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['modules'] }),
  });

  const toggleFlag = useMutation({
    mutationKey: ['feature-flags', 'toggle'],
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      ModulesService.updateFlag(key, enabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feature-flags'] }),
  });

  return {
    modules,
    flags,
    updateModule,
    setActive,
    setVisible,
    markBeta,
    toggleFlag,
  };
}

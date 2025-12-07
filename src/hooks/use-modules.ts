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
    onMutate: async ({ id, active }: { id: string; active: boolean }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-session'] });
      const previous = queryClient.getQueryData<any>(['admin-session']);
      if (previous) {
        const modulesMap = previous.modules ? { ...previous.modules } : {};
        if (modulesMap[id]) {
          modulesMap[id] = { ...modulesMap[id], is_active: active, active };
        }
        const activeModules = { ...(previous.activeModules || {}) };
        activeModules[id] = active;
        const next = { ...previous, modules: modulesMap, activeModules };
        queryClient.setQueryData(['admin-session'], next);
      }
      return { previous };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.previous) queryClient.setQueryData(['admin-session'], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['modules'] }),
  });

  const setVisible = useMutation({
    mutationKey: ['modules', 'set-visible'],
    mutationFn: ({ id, visible }: { id: string; visible: boolean }) =>
      ModulesService.setVisible(id, visible),
    onMutate: async ({ id, visible }: { id: string; visible: boolean }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-session'] });
      const previous = queryClient.getQueryData<any>(['admin-session']);
      if (previous && previous.modules && previous.modules[id]) {
        const next = { ...previous, modules: { ...previous.modules, [id]: { ...previous.modules[id], is_visible: visible, visibleInMenu: visible } } };
        queryClient.setQueryData(['admin-session'], next);
      }
      return { previous };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.previous) queryClient.setQueryData(['admin-session'], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['modules'] }),
  });

  const markBeta = useMutation({
    mutationKey: ['modules', 'mark-beta'],
    mutationFn: ({ id, beta }: { id: string; beta: boolean }) => ModulesService.markBeta(id, beta),
    onMutate: async ({ id, beta }: { id: string; beta: boolean }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-session'] });
      const previous = queryClient.getQueryData<any>(['admin-session']);
      if (previous && previous.modules && previous.modules[id]) {
        const next = { ...previous, modules: { ...previous.modules, [id]: { ...previous.modules[id], beta } } };
        queryClient.setQueryData(['admin-session'], next);
      }
      return { previous };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.previous) queryClient.setQueryData(['admin-session'], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['modules'] }),
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

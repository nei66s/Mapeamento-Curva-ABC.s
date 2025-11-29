'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RolesService, type SaveRoleInput } from '@/services/roles-service';
import type { Permission } from '@/types/admin';

export function useRoles() {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: ['roles'],
    queryFn: RolesService.list,
  });

  const create = useMutation({
    mutationKey: ['roles', 'create'],
    mutationFn: (payload: SaveRoleInput) => RolesService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  });

  const update = useMutation({
    mutationKey: ['roles', 'update'],
    mutationFn: ({ id, data }: { id: string; data: Partial<SaveRoleInput> }) =>
      RolesService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  });

  const remove = useMutation({
    mutationKey: ['roles', 'remove'],
    mutationFn: (id: string) => RolesService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  });

  const assignPermissions = useMutation({
    mutationKey: ['roles', 'assign-permissions'],
    mutationFn: ({ id, permissions }: { id: string; permissions: Permission[] }) =>
      RolesService.assignPermissions(id, permissions),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  });

  return { list, create, update, remove, assignPermissions };
}

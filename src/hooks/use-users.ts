'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserStatus } from '@/types/admin';
import { UsersService, type SaveUserInput, type UserFilters } from '@/services/users-service';

const usersKey = (filters: UserFilters = {}) => ['users', filters];

export function useUsers(filters: UserFilters = {}) {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: usersKey(filters),
    queryFn: () => UsersService.list(filters),
    keepPreviousData: true,
  } as any);

  const create = useMutation({
    mutationKey: ['users', 'create'],
    mutationFn: (payload: SaveUserInput) => UsersService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersKey(filters) }),
  });

  const update = useMutation({
    mutationKey: ['users', 'update'],
    mutationFn: ({ id, data }: { id: string; data: Partial<SaveUserInput> }) =>
      UsersService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersKey(filters) }),
  });

  const toggleStatus = useMutation({
    mutationKey: ['users', 'status'],
    mutationFn: ({ id, status, reason }: { id: string; status: UserStatus; reason?: string }) =>
      UsersService.toggleStatus(id, status, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersKey(filters) }),
  });

  const resetPassword = useMutation({
    mutationKey: ['users', 'reset-password'],
    mutationFn: (id: string) => UsersService.resetPassword(id),
  });

  return {
    ...(list as any),
    create,
    update,
    toggleStatus,
    resetPassword,
  };
}

import { useQuery } from '@tanstack/react-query';
import type { AdminSession } from '@/types/admin';
import { apiClient } from '@/lib/api-client';

export function useAdminSession() {
  return useQuery({
    queryKey: ['admin-session'],
    queryFn: () => apiClient.get<AdminSession>('/admin/session'),
    staleTime: 60_000,
  });
}

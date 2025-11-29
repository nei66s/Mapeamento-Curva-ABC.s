import { apiClient } from '@/lib/api-client';
import type { AuditFilter, AuditLog, Paginated } from '@/types/admin';

export const AuditService = {
  list: (filters: AuditFilter = {}) =>
    apiClient.get<Paginated<AuditLog>>('/admin/audit', { query: filters }),
  get: (id: string) => apiClient.get<AuditLog>(`/admin/audit/${id}`),
};

'use client';

import { useQuery } from '@tanstack/react-query';
import { AuditService } from '@/services/audit-service';
import type { AuditFilter, Paginated, AuditLog } from '@/types/admin';

export function useAuditLogs(filters: AuditFilter = {}) {
  return useQuery<Paginated<AuditLog>, Error>({
    queryKey: ['audit', 'logs', filters],
    queryFn: () => AuditService.list(filters),
    keepPreviousData: true,
  } as any);
}

export function useAuditLog(id?: string) {
  return useQuery<AuditLog, Error>({
    queryKey: ['audit', 'log', id],
    queryFn: () => (id ? AuditService.get(id) : Promise.reject('missing-id')),
    enabled: Boolean(id),
  } as any);
}

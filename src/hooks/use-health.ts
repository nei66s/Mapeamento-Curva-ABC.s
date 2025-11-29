'use client';

import { useQuery } from '@tanstack/react-query';
import { HealthService } from '@/services/health-service';

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: HealthService.snapshot,
    refetchInterval: 30_000,
  });
}

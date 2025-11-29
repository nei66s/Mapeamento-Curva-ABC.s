import { apiClient } from '@/lib/api-client';
import type { HealthSnapshot } from '@/types/admin';

export const HealthService = {
  snapshot: () => apiClient.get<HealthSnapshot>('/health'),
};

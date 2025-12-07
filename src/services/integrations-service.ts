import { apiClient } from '@/lib/api-client';
import type { ApiKeyCreatePayload, ApiKeyCreationResult, ApiKeyRecord } from '@/types/admin';

const endpoint = '/admin-panel/integrations';

export const IntegrationsService = {
  list: () => apiClient.get<{ items: ApiKeyRecord[] }>(endpoint),
  create: (payload: ApiKeyCreatePayload) => apiClient.post<ApiKeyCreationResult>(endpoint, payload),
  revoke: (id: string) => apiClient.delete<{ ok: boolean }>(endpoint, { query: { id } }),
};

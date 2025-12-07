import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IntegrationsService } from '@/services/integrations-service';
import type { ApiKeyCreatePayload, ApiKeyRecord, ApiKeyCreationResult } from '@/types/admin';

const queryKey = ['admin-integrations', 'api-keys'];

export function useApiKeys() {
  const queryClient = useQueryClient();
  const list = useQuery<{ items: ApiKeyRecord[] }>({
    queryKey,
    queryFn: () => IntegrationsService.list(),
    staleTime: 30_000,
  });

  const create = useMutation<ApiKeyCreationResult, unknown, ApiKeyCreatePayload>({
    mutationKey: [...queryKey, 'create'],
    mutationFn: (payload) => IntegrationsService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const revoke = useMutation({
    mutationKey: [...queryKey, 'revoke'],
    mutationFn: (id: string) => IntegrationsService.revoke(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    ...list,
    items: list.data?.items ?? [],
    create,
    revoke,
  };
}

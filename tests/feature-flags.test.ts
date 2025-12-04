import { ModulesService } from '@/services/modules-service';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe('Feature flags service', () => {
  it('envia toggle para o endpoint correto', async () => {
    const client = apiClient as unknown as { post: ReturnType<typeof vi.fn> };
    client.post.mockResolvedValue({ key: 'tracking.enabled', enabled: false });
    await ModulesService.updateFlag('tracking.enabled', false);
    expect(client.post).toHaveBeenCalledWith('/admin/flags/tracking.enabled', { enabled: false });
  });
});

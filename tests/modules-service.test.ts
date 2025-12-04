import { ModulesService } from '@/services/modules-service';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('ModulesService', () => {
  it('aciona endpoint de status com corpo esperado', async () => {
    const client = apiClient as unknown as { post: ReturnType<typeof vi.fn> };
    client.post.mockResolvedValue({ id: 'admin-modules', active: true });
    await ModulesService.setActive('admin-modules', true);
    expect(client.post).toHaveBeenCalledWith('/admin/modules/admin-modules/status', { active: true });
  });
});

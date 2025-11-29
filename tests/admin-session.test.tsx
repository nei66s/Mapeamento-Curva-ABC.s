import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAdminSession } from '@/hooks/use-admin-session';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const queryClient = new QueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useAdminSession', () => {
  it('usa endpoint /session e cache estável', async () => {
    (apiClient.get as any).mockResolvedValue({
      user: { id: 'u1', email: 'x@y.com', role: 'admin' },
      permissions: { 'admin-dashboard': true },
      activeModules: { 'admin-dashboard': true },
      featureFlags: {},
    });
    const { result } = renderHook(() => useAdminSession(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.get).toHaveBeenCalledWith('/session');
    expect(result.current.data?.permissions['admin-dashboard']).toBe(true);
  });

  it('retorna erro quando token é inválido/401', async () => {
    (apiClient.get as any).mockRejectedValue({ status: 401 });
    const { result } = renderHook(() => useAdminSession(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

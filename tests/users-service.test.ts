import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { UsersService } from '@/services/users-service';
import type { AdminUser } from '@/types/admin';
import { apiClient } from '@/lib/api-client';

const mockGet = (apiClient.get as unknown) as jest.MockedFunction<any>;

describe('UsersService.list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('normalizes array response to paginated', async () => {
    const payload: AdminUser[] = [
      { id: '1', name: 'A', email: 'a@example.com', role: 'admin' as any, status: 'active' as any },
    ];
    mockGet.mockResolvedValueOnce(payload);

    const res = await UsersService.list();
    expect(res.items).toHaveLength(1);
    expect(res.total).toBe(1);
    expect(res.page).toBe(1);
    expect(res.pageSize).toBe(1);
  });

  it('accepts paginated payload with items/total', async () => {
    const payload = { items: [{ id: '2', name: 'B', email: 'b@example.com', role: 'user' as any, status: 'active' as any }], total: 10, page: 2, pageSize: 5 };
    mockGet.mockResolvedValueOnce({ result: payload });

    const res = await UsersService.list({ page: 2, pageSize: 5 });
    expect(res.items).toHaveLength(1);
    expect(res.total).toBe(10);
    expect(res.page).toBe(2);
    expect(res.pageSize).toBe(5);
  });

  it('maps rows/count fallback', async () => {
    const payload = { rows: [{ id: '3', name: 'C', email: 'c@example.com', role: 'user' as any, status: 'active' as any }], count: 42 };
    mockGet.mockResolvedValueOnce(payload);

    const res = await UsersService.list();
    expect(res.items).toHaveLength(1);
    expect(res.total).toBe(42);
  });
});

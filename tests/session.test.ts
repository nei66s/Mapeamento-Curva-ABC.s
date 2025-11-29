import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/server/adapters/users-adapter', () => ({ getUserById: vi.fn() }));
vi.mock('@/server/adapters/roles-adapter', () => ({ getRolePermissions: vi.fn() }));
vi.mock('@/server/adapters/modules-adapter', () => ({ getActiveModules: vi.fn() }));
vi.mock('@/server/adapters/feature-flags-adapter', () => ({ listFlags: vi.fn() }));

import { buildAdminSession } from '@/server/adapters/session-adapter';
import { getUserById } from '@/server/adapters/users-adapter';

describe('session-adapter', () => {
  beforeEach(() => {
    (getUserById as any).mockReset?.();
  });

  it('buildAdminSession returns null when user missing', async () => {
    (getUserById as any).mockResolvedValueOnce(null);
    const s = await buildAdminSession('nope');
    expect(s).toBeNull();
  });
});

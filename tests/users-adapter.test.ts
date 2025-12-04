import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  default: {
    query: vi.fn((query) => {
      if (query.includes('to_regclass')) {
        return { rows: [{ reg: 'users_full' }] };
      }
      if (query.includes('information_schema.columns')) {
        return { rows: [{ column_name: 'status' }, { column_name: 'permissions' }] };
      }
      if (query.includes('users_full')) {
        return {
          rows: [
            {
              id: 'u1',
              name: 'User 1',
              email: 'user1@example.com',
              role: 'admin',
              created_at: '2025-12-01T00:00:00Z',
              roles_arr: ['admin'],
              profile: { extra: 'data' },
            },
          ],
        };
      }
      if (query.includes('user_roles')) {
        return { rows: [{ name: 'user' }] };
      }
      if (query.includes('user_profile')) {
        return { rows: [{ extra: { extra: 'data' } }] };
      }
      if (query.includes('users') && query.includes('email')) {
        return { rows: [{ id: 'u1', email: 'a@b', name: 'A' }] };
      }
      if (query.includes('users') && query.includes('legacy')) {
        return {
          rows: [
            {
              id: 'u2',
              name: 'User 2',
              email: 'user2@example.com',
              role: 'user',
              created_at: '2025-12-02T00:00:00Z',
              roles_agg: [{ name: 'user' }],
              profile: null,
            },
          ],
        };
      }
      return { rows: [], rowCount: 0 };
    }),
  },
}));

import pool from '@/lib/db';
import { getUserByEmail, getUserById, createUser, listUsers } from '@/server/adapters/users-adapter';

describe('users-adapter', () => {
  beforeEach(() => {
    (pool.query as any).mockReset();
  });

  it('getUserByEmail returns row when found', async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [{ id: 'u1', email: 'a@b', name: 'A' }] });
    const u = await getUserByEmail('a@b');
    expect(u).toBeDefined();
    expect(u!.id).toBe('u1');
  });

  it('createUser inserts and returns created', async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [{ id: 'u2', email: 'c@d', name: 'C' }] });
    const r = await createUser({ name: 'C', email: 'c@d' });
    expect(r).toBeDefined();
    expect(r.id).toBe('u2');
  });

  it('listUsers uses users_full view when available', async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [{ reg: 'users_full' }] }); // View exists
    (pool.query as any).mockResolvedValueOnce({
      rows: [
        {
          id: 'u1',
          name: 'User 1',
          email: 'user1@example.com',
          role: 'admin',
          created_at: '2025-12-01T00:00:00Z',
          roles_arr: ['admin'],
          profile: { extra: 'data' },
        },
      ],
    });

    const users = await listUsers(10, 0);
    expect(users).toHaveLength(1);
    expect(users[0].id).toBe('u1');
    expect(users[0].roles).toContain('admin');
  });

  it('listUsers falls back to legacy query when users_full view is unavailable', async () => {
    // Mocks sequence for fallback path:
    // 1) view check -> no users_full
    (pool.query as any).mockResolvedValueOnce({ rows: [{ reg: null }] });
    // 2) columns check for permissions -> none
    (pool.query as any).mockResolvedValueOnce({ rowCount: 0, rows: [] });
    // 3) columns check for status -> none
    (pool.query as any).mockResolvedValueOnce({ rowCount: 0, rows: [] });
    // 4) profile table presence -> absent
    (pool.query as any).mockResolvedValueOnce({ rows: [{ reg: null }] });
    // 5) main fallback query returning users
    (pool.query as any).mockResolvedValueOnce({
      rows: [
        {
          id: 'u2',
          name: 'User 2',
          email: 'user2@example.com',
          role: 'user',
          created_at: '2025-12-02T00:00:00Z',
          roles_agg: [{ name: 'user' }],
          profile: null,
          permissions: null,
          status: null,
        },
      ],
    });
    // 6) audit_logs lastAccessAt lookup -> none
    (pool.query as any).mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const users = await listUsers(10, 0);
    expect(users).toHaveLength(1);
    expect(users[0].id).toBe('u2');
    expect(users[0].roles).toContain('user');
  });
});

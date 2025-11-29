import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));

import pool from '@/lib/db';
import { getUserByEmail, getUserById, createUser } from '@/server/adapters/users-adapter';

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
});

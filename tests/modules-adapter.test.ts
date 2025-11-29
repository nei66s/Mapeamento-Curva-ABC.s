import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));

import pool from '@/lib/db';
import { listModules, getModuleByKey } from '@/server/adapters/modules-adapter';

describe('modules-adapter', () => {
  beforeEach(() => {
    (pool.query as any).mockReset();
  });

  it('listModules returns rows', async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [{ key: 'm1', name: 'M1' }] });
    const rows = await listModules();
    expect(Array.isArray(rows)).toBe(true);
    expect(rows[0].key).toBe('m1');
  });

  it('getModuleByKey returns null if none', async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [] });
    const m = await getModuleByKey('nope');
    expect(m).toBeNull();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the DB pool used by the module before importing the module under test
vi.mock('../src/lib/db', () => ({
  default: {
    query: vi.fn(),
  },
}));

import pool from '../src/lib/db';
import { listChecklistItems } from '../src/lib/compliance.server';

describe('listChecklistItems error handling', () => {
  beforeEach(() => {
    (pool.query as any).mockReset();
  });

  it('rethrows unexpected DB errors', async () => {
    (pool.query as any).mockRejectedValueOnce(new Error('boom'));
    await expect(listChecklistItems()).rejects.toThrow('boom');
  });

  it('returns empty array when table missing (42P01)', async () => {
    const e: any = new Error('missing table');
    e.code = '42P01';
    (pool.query as any).mockRejectedValueOnce(e);
    const res = await listChecklistItems();
    expect(res).toEqual([]);
  });
});

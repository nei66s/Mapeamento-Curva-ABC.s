import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the DB pool used by the module before importing the module under test
vi.mock('../src/lib/db', () => ({
  default: {
    query: vi.fn(),
  },
}));

import pool from '../src/lib/db';
import { getParetoItems, getParetoByTitle } from '../src/lib/incidents.server';

describe('getParetoItems', () => {
  beforeEach(() => {
    (pool.query as any).mockReset();
  });

  it('returns mapped rows when DB returns data', async () => {
    (pool.query as any).mockResolvedValueOnce({
      rowCount: 2,
      rows: [
        {
          group_key: 'Produto A',
          cnt: 10,
          pct: 71.43,
          cumulative_count: 10,
          cumulative_pct: 71.43,
        },
        {
          group_key: 'Produto B',
          cnt: 4,
          pct: 28.57,
          cumulative_count: 14,
          cumulative_pct: 100,
        },
      ],
    });

    const res = await getParetoItems(2);
    expect(res).toHaveLength(2);
    expect(res[0]).toEqual({
      itemName: 'Produto A',
      count: 10,
      pct: 71.43,
      cumulativeCount: 10,
      cumulativePct: 71.43,
    });
    expect(res[1].itemName).toBe('Produto B');
  });

  it('returns empty array when DB returns no rows', async () => {
    (pool.query as any).mockResolvedValueOnce({ rowCount: 0, rows: [] });
    const res = await getParetoItems(5);
    expect(res).toEqual([]);
  });

  it('groups by title when requested', async () => {
    (pool.query as any).mockResolvedValueOnce({
      rowCount: 1,
      rows: [
        {
          group_key: 'Falha na Etiqueta',
          cnt: 3,
          pct: 100,
          cumulative_count: 3,
          cumulative_pct: 100,
        },
      ],
    });

    const res = await getParetoByTitle(1);
    expect(res).toHaveLength(1);
    expect(res[0].itemName).toBe('Falha na Etiqueta');
    expect(res[0].count).toBe(3);
  });
});

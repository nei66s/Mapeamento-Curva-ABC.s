import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the DB pool used by the module before importing the module under test
vi.mock('../src/lib/db', () => ({
  default: {
    query: vi.fn(),
  },
}));

import pool from '../src/lib/db';
import { addChecklistItem, scheduleVisit } from '../src/lib/compliance.server';

describe('addChecklistItem', () => {
  beforeEach(() => {
    (pool.query as any).mockReset();
  });

  it('returns generated fallback when table missing (42P01)', async () => {
    // Simulate getTableColumns returning empty rows (no columns detected)
    (pool.query as any).mockResolvedValueOnce({ rows: [] });
    const created = await addChecklistItem({ name: 'Teste', classification: 'C' });
    expect(created).toBeTruthy();
    expect(created.id).toMatch(/^CHK-/);
    expect(created.name).toBe('Teste');
  });

  it('rethrows unexpected DB errors', async () => {
    // First call: getTableColumns -> return columns so the insert path is attempted
    (pool.query as any).mockResolvedValueOnce({ rows: [{ column_name: 'name' }] });
    // Second call: insert -> fail with unexpected error
    (pool.query as any).mockRejectedValueOnce(new Error('boom'));
    await expect(addChecklistItem({ name: 'X' })).rejects.toThrow('boom');
  });
});

describe('scheduleVisit', () => {
  beforeEach(() => {
    (pool.query as any).mockReset();
  });

  it('returns null when compliance_visits missing (42P01)', async () => {
    const e: any = new Error('missing table');
    e.code = '42P01';
    // First call (insert) fails with 42P01; fallback calls may also run but we mock a simple rejection
    (pool.query as any).mockRejectedValue(e);
    const res = await scheduleVisit({ storeId: 'S1', storeName: 'Loja', visitDate: '2025-11-13', items: [] });
    expect(res).toBeNull();
  });

  it('rethrows unexpected DB errors', async () => {
    // First call: getTableColumns('compliance_visits') -> return some columns so insert is attempted
    (pool.query as any).mockResolvedValueOnce({ rows: ['store_id','visit_date','items'].map(c => ({ column_name: c })) });
    // Second call: INSERT -> fail with unexpected error
    (pool.query as any).mockRejectedValueOnce(new Error('boom'));
    await expect(scheduleVisit({ storeId: 'S2' })).rejects.toThrow('boom');
  });
});

import { describe, it, expect } from 'vitest';
const WL: string[] = require('../scripts/table-whitelist');

describe('table whitelist', () => {
  it('has no duplicates', () => {
    const set = new Set(WL);
    expect(set.size).toBe(WL.length);
  });

  it('contains core tables', () => {
    expect(WL).toContain('users');
    expect(WL).toContain('items');
    expect(WL).toContain('suppliers');
  });
});

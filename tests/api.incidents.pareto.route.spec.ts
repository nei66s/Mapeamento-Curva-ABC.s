import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the incidents server helpers before importing the route
vi.mock('@/lib/incidents.server', () => ({
  getParetoItems: vi.fn(),
  getParetoByTitle: vi.fn(),
}));

import { GET } from '../src/app/api/incidents/pareto/route';

describe('GET /api/incidents/pareto', () => {
  beforeEach(() => {
    // reset mocks from the mocked module
    // we'll import the mocked module inside each test to avoid loading the real DB
  });

  it('returns top items by default', async () => {
    const mocked = (await import('@/lib/incidents.server')) as any;
    mocked.getParetoItems.mockResolvedValueOnce([{ itemName: 'A', count: 5 }]);
    const req = new Request('http://localhost/api/incidents/pareto');
    const res = await GET(req as any);
    const body = await res.json();
    expect(body).toEqual([{ itemName: 'A', count: 5 }]);
    expect(mocked.getParetoItems).toHaveBeenCalledWith(7, 'item');
  });

  it('accepts group=title and top parameter', async () => {
    const mocked = (await import('@/lib/incidents.server')) as any;
    mocked.getParetoByTitle.mockResolvedValueOnce([{ itemName: 'Falha', count: 3 }]);
    const req = new Request('http://localhost/api/incidents/pareto?group=title&top=3');
    const res = await GET(req as any);
    const body = await res.json();
    expect(body).toEqual([{ itemName: 'Falha', count: 3 }]);
    expect(mocked.getParetoByTitle).toHaveBeenCalledWith(3);
  });

  it('returns 400 for invalid top', async () => {
    const req = new Request('http://localhost/api/incidents/pareto?top=abc');
    const res = await GET(req as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });
});

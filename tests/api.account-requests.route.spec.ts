import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  __esModule: true,
  default: { query: vi.fn() },
}));

vi.mock('@/lib/users.server', () => ({
  __esModule: true,
  getUserByEmail: vi.fn(),
}));

vi.mock('@/lib/account-requests.server', () => ({
  __esModule: true,
  createAccountRequest: vi.fn(),
  listAccountRequests: vi.fn(),
}));

import { POST } from '../src/app/api/account-requests/route';
import { resetAccountRequestsRateLimit } from '../src/lib/account-requests-rate-limit';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/users.server';
import { createAccountRequest } from '@/lib/account-requests.server';

const mockedPool = pool as { query: any };
const mockedGetUserByEmail = getUserByEmail as unknown as any;
const mockedCreateAccountRequest = createAccountRequest as unknown as any;

describe('POST /api/account-requests', () => {
  const headers = { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' };
  const buildReq = (overrides: Record<string, any> = {}) => {
    const body = JSON.stringify({
      name: 'Test User',
      email: 'test@example.com',
      message: 'demo',
      ...overrides,
    });
    return new Request('http://localhost/api/account-requests', {
      method: 'POST',
      headers,
      body,
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetAccountRequestsRateLimit();
    mockedPool.query.mockResolvedValue({ rows: [{ c: '0' }] });
    mockedGetUserByEmail.mockResolvedValue(null);
    mockedCreateAccountRequest.mockResolvedValue({ id: 'ar-1', name: 'Test', email: 'test@example.com', status: 'pending' });
  });

  it('blocks submissions that fill the honeypot', async () => {
    const res = await POST(buildReq({ honeypot: 'spam' }) as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Detectamos atividade suspeita');
  });

  it('enforces the rate limit per client IP', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await POST(buildReq() as any);
      expect(res.status).toBe(200);
    }
    const blocked = await POST(buildReq() as any);
    expect(blocked.status).toBe(429);
    const body = await blocked.json();
    expect(body.error).toContain('Limite de tentativas');
  });
});

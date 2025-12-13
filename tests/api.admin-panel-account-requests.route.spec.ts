import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/account-requests.server', () => ({
  __esModule: true,
  listAccountRequests: vi.fn(),
  setAccountRequestStatus: vi.fn(),
  deleteAccountRequest: vi.fn(),
}));

vi.mock('@/lib/users.server', () => ({
  __esModule: true,
  createUser: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

import { POST } from '../src/app/api/admin-panel/account-requests/route';
import { setAccountRequestStatus } from '@/lib/account-requests.server';
import { createUser } from '@/lib/users.server';
import { cookies } from 'next/headers';

const mockedCookies = cookies as unknown as ReturnType<typeof vi.fn>;
const mockedSetAccountRequestStatus = setAccountRequestStatus as unknown as any;
const mockedCreateUser = createUser as unknown as any;

describe('POST /api/admin-panel/account-requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authorized', async () => {
    mockedCookies.mockResolvedValueOnce({ get: () => undefined });
    const req = new Request('http://localhost/api/admin-panel/account-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', id: 'ar-123' }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty('error', 'Unauthorized');
  });

  it('approves request, creates user, and returns metadata', async () => {
    const adminToken = encodeURIComponent(JSON.stringify({ role: 'admin' }));
    mockedCookies.mockResolvedValueOnce({ get: () => ({ value: adminToken }) });
    mockedSetAccountRequestStatus.mockResolvedValueOnce({ id: 'ar-1', name: 'Ana', email: 'ana@example.com', status: 'approved' });
    mockedCreateUser.mockResolvedValueOnce({ id: 'u-1', email: 'ana@example.com' });

    const req = new Request('http://localhost/api/admin-panel/account-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', id: 'ar-1' }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(mockedSetAccountRequestStatus).toHaveBeenCalledWith('ar-1', 'approved');
    expect(mockedCreateUser).toHaveBeenCalledWith({ name: 'Ana', email: 'ana@example.com', role: 'visualizador' });
    expect(body).toHaveProperty('createdUser');
  });

  it('rejects request when action is reject', async () => {
    const adminToken = encodeURIComponent(JSON.stringify({ role: 'admin' }));
    mockedCookies.mockResolvedValueOnce({ get: () => ({ value: adminToken }) });
    mockedSetAccountRequestStatus.mockResolvedValueOnce({ id: 'ar-2', status: 'rejected' });

    const req = new Request('http://localhost/api/admin-panel/account-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', id: 'ar-2' }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(mockedCreateUser).not.toHaveBeenCalled();
  });

  it('returns 400 for unknown action', async () => {
    const adminToken = encodeURIComponent(JSON.stringify({ role: 'admin' }));
    mockedCookies.mockResolvedValueOnce({ get: () => ({ value: adminToken }) });
    const req = new Request('http://localhost/api/admin-panel/account-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'foo', id: 'ar-x' }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error', 'Unknown action');
  });
});

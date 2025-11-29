import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/server/adapters/users-adapter', () => ({
  getUserByEmail: vi.fn(),
}));

import { getUserByEmail } from '@/server/adapters/users-adapter';
import bcrypt from 'bcryptjs';
import { issueAccessToken, issueRefreshToken, verifyAccessToken, verifyRefreshToken } from '@/lib/auth/jwt';

describe('auth jwt helpers', () => {
  it('issue and verify access token', () => {
    const t = issueAccessToken('u1', 'admin');
    const v = verifyAccessToken(t);
    expect(v.valid).toBe(true);
    expect(v.userId).toBe('u1');
  });

  it('issue and verify refresh token', () => {
    const t = issueRefreshToken('u2');
    const v = verifyRefreshToken(t);
    expect(v.valid).toBe(true);
    expect(v.userId).toBe('u2');
  });
});

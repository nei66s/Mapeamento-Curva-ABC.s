import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '@/lib/auth'

describe('auth helpers', () => {
  it('hashes and verifies password', async () => {
    const pw = 'Password123!'
    const h = await hashPassword(pw)
    expect(typeof h).toBe('string')
    const ok = await verifyPassword(pw, h)
    expect(ok).toBe(true)
    const bad = await verifyPassword('wrong', h)
    expect(bad).toBe(false)
  })
})

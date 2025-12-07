import { describe, it, expect } from 'vitest'
import { checkRateLimit } from '@/lib/rate-limit'

describe('rate-limit helper', () => {
  it('allows up to limit and then blocks', () => {
    const key = `test-${Math.random()}`
    // call limit times
    for (let i = 0; i < 6; i++) {
      const r = checkRateLimit(key, 6, 10000)
      expect(r.ok).toBe(true)
    }
    // next call should be blocked
    const r2 = checkRateLimit(key, 6, 10000)
    expect(r2.ok).toBe(false)
  })
})

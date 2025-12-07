import { describe, it, expect, vi, beforeEach } from 'vitest'
import { promises as fsp } from 'fs'

vi.mock('@/server/adapters/users-adapter', async () => {
  return {
    getUserByEmail: async (email: string) => ({ id: 'u1', email, name: 'T' }),
    updateUser: async (id: string, patch: any) => ({ id, ...patch }),
  }
})

beforeEach(async () => {
  await fsp.mkdir('tmp', { recursive: true })
  await fsp.writeFile('tmp/reset-tokens.json', '{}', 'utf8')
  vi.resetModules()
})

// import route after mocks to ensure mocks are applied
import * as route from '@/app/api/auth/reset-password/route'

describe('reset-password route', () => {
  beforeEach(() => { vi.resetModules() })

  it('returns 400 for missing token/password', async () => {
    const req = new Request('http://localhost', { method: 'POST', body: JSON.stringify({}) })
    const res: any = await route.POST(req)
    const json = await res.json()
    expect(json.ok).toBe(false)
  })

  it('updates password when token exists', async () => {
    // prepare tokens file by calling forgot route or directly mocking fs; here we call POST of forgot to populate
    const forgot = await (await import('@/app/api/auth/forgot-password/route')).POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ email: 'a@b.com' }) }))
    const fj = await forgot.json()
    // eslint-disable-next-line no-console
    console.debug('forgot->', fj)
    expect(fj.ok).toBe(true)
    const link = fj.result.resetLink as string
    const token = new URL(link).searchParams.get('token')
    const req = new Request('http://localhost', { method: 'POST', body: JSON.stringify({ token, password: 'Password123' }) })
    const res: any = await route.POST(req)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })
})

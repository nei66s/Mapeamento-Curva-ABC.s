import { describe, it, expect, vi, beforeEach } from 'vitest'
import { promises as fsp } from 'fs'

vi.mock('nodemailer', () => ({
  createTransport: () => ({ sendMail: async (_: any) => ({}) })
}))

// prepare tmp token file before importing the route
beforeEach(async () => {
  await fsp.mkdir('tmp', { recursive: true })
  await fsp.writeFile('tmp/reset-tokens.json', '{}', 'utf8')
})

import * as route from '@/app/api/auth/forgot-password/route'

describe('forgot-password route', () => {
  beforeEach(() => { vi.resetModules() })

  it('returns 400 for invalid email', async () => {
    const req = new Request('http://localhost', { method: 'POST', body: JSON.stringify({ email: 'x' }) })
    const res: any = await route.POST(req)
    const json = await res.json()
    expect(json.ok).toBe(false)
  })

  it('generates token and returns resetLink for valid email', async () => {
    const req = new Request('http://localhost', { method: 'POST', body: JSON.stringify({ email: 'test@example.com' }) })
    const res: any = await route.POST(req)
    const json = await res.json()
    // debug output when running tests
    // eslint-disable-next-line no-console
    console.debug('forgot json ->', json)
    expect(json.ok).toBe(true)
    expect(json.result?.resetLink).toBeTruthy()
  })
})

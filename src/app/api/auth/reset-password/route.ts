import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { getUserByEmail, updateUser } from '@/server/adapters/users-adapter'
import { hashPassword } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { validatePassword } from '@/lib/validators'

const TOKENS_FILE = path.join(process.cwd(), 'tmp', 'reset-tokens.json')

async function readTokens() {
  try {
    const s = await fs.readFile(TOKENS_FILE, 'utf8')
    return JSON.parse(s || '{}')
  } catch (err) {
    return {}
  }
}

async function writeTokens(obj: any) {
  await fs.mkdir(path.dirname(TOKENS_FILE), { recursive: true })
  await fs.writeFile(TOKENS_FILE, JSON.stringify(obj, null, 2), 'utf8')
}

export async function POST(req: Request) {
  try {
    const ip = (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown')
    const rl = checkRateLimit(`reset:${ip}`, 6, 60 * 1000)
    if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate limit' }, { status: 429 })

    const body = await req.json()
    const token = (body?.token || '').toString()
    const pwdCheck = validatePassword(body?.password)
    if (!token || !pwdCheck.ok) return NextResponse.json({ ok: false, error: 'token ou senha ausente/invalida' }, { status: 400 })
    const password = pwdCheck.value

    const tokens = await readTokens()
    // find email by token
    const entry = Object.entries(tokens).find(([, v]: any) => v?.token === token)
    if (!entry) return NextResponse.json({ ok: false, error: 'token inválido' }, { status: 400 })
    const [email, info] = entry as [string, any]
    if (info.expiresAt && Date.now() > info.expiresAt) {
      // remove expired token
      delete tokens[email]
      await writeTokens(tokens)
      return NextResponse.json({ ok: false, error: 'token expirado' }, { status: 400 })
    }

    // Find user and update password
    const user = await getUserByEmail(email)
    if (!user) {
      // remove token to be safe
      delete tokens[email]
      await writeTokens(tokens)
      return NextResponse.json({ ok: false, error: 'usuario nao encontrado' }, { status: 400 })
    }

    const hashed = await hashPassword(password)
    await updateUser(String(user.id), { password_hash: hashed })

    // remove token after successful update
    delete tokens[email]
    await writeTokens(tokens)

    return NextResponse.json({ ok: true, result: { email } })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 })
  }
}

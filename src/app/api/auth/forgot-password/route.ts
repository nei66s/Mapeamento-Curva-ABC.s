import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { checkRateLimit } from '@/lib/rate-limit'
import { validateEmail } from '@/lib/validators'

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

function createMailerIfConfigured() {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !port || !user || !pass) return null
  return nodemailer.createTransport({ host, port, auth: { user, pass }, secure: Number(port) === 465 })
}

export async function POST(req: Request) {
  try {
    const ip = (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown')
    const rl = checkRateLimit(`forgot:${ip}`, 6, 60 * 1000)
    if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate limit' }, { status: 429 })

    const body = await req.json()
    const v = validateEmail(body?.email)
    if (!v.ok) return NextResponse.json({ ok: false, error: 'email inválido' }, { status: 400 })
    const email = v.value

    const tokens = await readTokens()
    const token = crypto.randomBytes(20).toString('hex')
    const expiresAt = Date.now() + 1000 * 60 * 60 // 1 hora
    tokens[email] = { token, expiresAt }
    await writeTokens(tokens)

    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'
    const resetLink = `${base}/reset-password?token=${token}`

    // Try send email if SMTP is configured
    const transporter = createMailerIfConfigured()
    if (transporter) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || `no-reply@${process.env.SMTP_HOST}`,
          to: email,
          subject: 'Redefinição de senha',
          text: `Para redefinir sua senha acesse: ${resetLink}`,
          html: `<p>Para redefinir sua senha clique no link abaixo:</p><p><a href="${resetLink}">${resetLink}</a></p>`,
        })
      } catch (e) {
        // log but continue to return result so devs can see link
        console.error('[forgot-password] email send failed', e)
      }
    }

    // In dev we return the link to help testing; in production you may omit it.
    return NextResponse.json({ ok: true, result: { resetLink } })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 })
  }
}

import { z } from 'zod'

export const emailSchema = z.string().min(3).max(254).email()
export const passwordSchema = z.string().min(6).max(256)

export function validateEmail(value: unknown) {
  try {
    return { ok: true, value: emailSchema.parse(String(value || '').trim().toLowerCase()) }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'invalid email' }
  }
}

export function validatePassword(value: unknown) {
  try {
    return { ok: true, value: passwordSchema.parse(String(value || '')) }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'invalid password' }
  }
}

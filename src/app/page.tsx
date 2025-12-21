import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyAccessToken } from '@/lib/auth/jwt'

export default function Page() {
  const cookieStore = cookies()
  const token = cookieStore.get('pm_access_token')?.value ?? null
  const verified = verifyAccessToken(token)
  if (verified.valid) {
    redirect('/indicators')
  }
  redirect('/login')
}

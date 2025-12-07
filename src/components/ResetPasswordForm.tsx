"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'

type Props = { token?: string | null; returnTo?: string | null }

export default function ResetPasswordForm({ token, returnTo }: Props) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [localError, setLocalError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return setStatus("Token ausente")
    setLocalError(null)
    if (password.length < 6) {
      setLocalError('Senha deve ter ao menos 6 caracteres')
      return
    }
    if (password !== confirmPassword) {
      setLocalError('Senhas não conferem')
      return
    }

    setLoading(true)
    setStatus(null)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const json = await res.json()
      if (json?.ok) {
        setStatus('Senha redefinida com sucesso.')
        // redirect after a short delay to show message
        setTimeout(() => {
          try {
            if (returnTo && returnTo.startsWith('/')) router.push(returnTo)
            else router.push('/login')
          } catch (e) { /* ignore */ }
        }, 1200)
      }
      else setStatus(json?.error || 'Erro ao redefinir senha')
    } catch (err) {
      setStatus('Erro de rede')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
      <div style={{ marginBottom: 8 }}>
        <label>
          Nova senha
          <input
            type="password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>
          Confirme a senha
          <input
            type="password"
            value={confirmPassword}
            required
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>
      </div>
      <button type="submit" disabled={loading} style={{ padding: '8px 12px' }}>
        {loading ? 'Processando...' : 'Redefinir senha'}
      </button>
      {status && <p style={{ marginTop: 12 }}>{status}</p>}
    </form>
  )
}

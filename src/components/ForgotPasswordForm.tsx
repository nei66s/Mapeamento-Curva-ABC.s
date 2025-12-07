"use client"

import { useState } from "react"
import { validateEmail } from '@/lib/validators'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    const v = validateEmail(email)
    if (!v.ok) {
      setStatus('Email inválido')
      setLoading(false)
      return
    }
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const json = await res.json()
      if (json?.ok) setStatus("Verifique seu e-mail para instruções (modo dev: link retornado).")
      else setStatus(json?.error || "Erro ao solicitar redefinição")
    } catch (err) {
      setStatus("Erro de rede")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
      <label style={{ display: "block", marginBottom: 8 }}>
        Email
        <input
          type="email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
        />
      </label>
      <button type="submit" disabled={loading} style={{ padding: "8px 12px" }}>
        {loading ? "Enviando..." : "Enviar link de redefinição"}
      </button>
      {status && <p style={{ marginTop: 12 }}>{status}</p>}
    </form>
  )
}

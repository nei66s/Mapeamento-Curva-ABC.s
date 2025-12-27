"use client";
import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tokenFromQuery = searchParams?.get('token') || '';
  const emailFromQuery = searchParams?.get('email') || '';

  const [token, setToken] = useState(tokenFromQuery);
  const [email] = useState(emailFromQuery);
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (tokenFromQuery) setToken(tokenFromQuery);
  }, [tokenFromQuery]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!token) return setMessage('Token é obrigatório');
    if (!newPassword) return setMessage('Nova senha é obrigatória');
    if (newPassword !== confirm) return setMessage('Senhas não conferem');
    setLoading(true);
    try {
      const res = await fetch('/api/admin-panel/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Erro');
      setMessage('Senha redefinida com sucesso. Você pode entrar agora.');
      setTimeout(() => router.push('/'), 1500);
    } catch (err: any) {
      setMessage(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell mx-auto mt-24 max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">Redefinir senha</h1>
      {email ? <p className="text-sm text-muted-foreground">Email: {email}</p> : null}
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label htmlFor="rp-token" className="block text-sm text-muted-foreground">Token</label>
          <input id="rp-token" name="token" value={token} onChange={e => setToken(e.target.value)} placeholder="Cole o token recebido" title="Token de redefinição" className="surface-control w-full" />
        </div>
        <div>
          <label htmlFor="rp-new" className="block text-sm text-muted-foreground">Nova senha</label>
          <input id="rp-new" name="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Nova senha" title="Nova senha" className="surface-control w-full" />
        </div>
        <div>
          <label htmlFor="rp-confirm" className="block text-sm text-muted-foreground">Confirme a senha</label>
          <input id="rp-confirm" name="confirmPassword" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Digite novamente a senha" title="Confirme a senha" className="surface-control w-full" />
        </div>
        <div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Enviando...' : 'Redefinir senha'}
          </Button>
        </div>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </form>
    </div>
  );
}

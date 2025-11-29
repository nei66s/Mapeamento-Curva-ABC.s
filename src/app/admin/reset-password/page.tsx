"use client";
import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

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
    <div className="max-w-md mx-auto mt-24 p-6 bg-white rounded shadow">
      <h1 className="text-xl font-semibold mb-4">Redefinir senha</h1>
      {email ? <p className="text-sm mb-2">Email: {email}</p> : null}
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm">Token</label>
          <input value={token} onChange={e => setToken(e.target.value)} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm">Nova senha</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm">Confirme a senha</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="w-full border p-2 rounded" />
        </div>
        <div>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
            {loading ? 'Enviando...' : 'Redefinir senha'}
          </button>
        </div>
        {message ? <p className="text-sm mt-2">{message}</p> : null}
      </form>
    </div>
  );
}

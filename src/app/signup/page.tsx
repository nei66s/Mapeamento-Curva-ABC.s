"use client";

import React, { useState, useMemo } from 'react';

function validateEmail(email: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'submitted'>('idle');
  const [error, setError] = useState<string | null>(null);

  const highlights = [
    'Aprovação manual para manter a segurança dos dados.',
    'Acesso completo a dashboards e relatórios filtrados.',
    'Equipe dedicada para suporte e integrações.',
  ];

  const heroStats = [
    { label: 'Painéis ativos', value: '48' },
    { label: 'Solicitações aprovadas', value: '124' },
    { label: 'Tempo médio de resposta', value: '1 dia útil' },
  ];

  const isNameValid = useMemo(() => name.trim().length >= 3, [name]);
  const isEmailValid = useMemo(() => validateEmail(email), [email]);
  const canSubmit = isNameValid && isEmailValid && status !== 'loading';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isNameValid) return setError('Informe um nome com pelo menos 3 caracteres.');
    if (!isEmailValid) return setError('Informe um email válido.');
    setStatus('loading');

    try {
      const res = await fetch('/api/account-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim(), honeypot: honeypot.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json?.error || 'Erro ao enviar solicitação.');
        setStatus('idle');
        return;
      }

      setStatus('submitted');
      setName('');
      setEmail('');
      setMessage('');
      setHoneypot('');
      setTimeout(() => setStatus('idle'), 4500);
    } catch (err) {
      setError('Erro de rede ao enviar solicitação.');
      setStatus('idle');
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 py-10 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.3),_transparent_45%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(14,165,233,0.2),_transparent_40%)]" aria-hidden="true" />

      <section className="relative z-10 w-full max-w-6xl grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-lg p-8 shadow-[0_30px_80px_rgba(15,23,42,0.7)]">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-300">Solicitar acesso</p>
          <h1 className="mt-4 text-4xl font-semibold text-white leading-tight">
            Conta protegida. Painéis dedicados. Decisões informadas.
          </h1>
          <p className="mt-3 text-sm text-slate-300">
            Agilize a concessão do seu acesso com informações claras sobre o uso pretendido. Cada solicitação passa por uma validação humana para manter a integridade dos dados.
          </p>

          <div className="mt-6 grid gap-3">
            {highlights.map((item) => (
              <div key={item} className="flex items-start gap-3 text-sm text-slate-200">
                <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500" aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 text-xs text-slate-300">
            {heroStats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                <p className="text-sm font-semibold text-white">{stat.value}</p>
                <p className="mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/90 p-8 text-slate-900 shadow-[0_30px_70px_rgba(15,23,42,0.4)]">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            <span>Conta corporativa</span>
            <span>Sem cobrança imediata</span>
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-slate-900">Envie sua solicitação</h2>

          {error && (
            <div role="alert" aria-live="assertive" className="mt-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={submit} noValidate className="space-y-4 mt-6">
            <input
              type="text"
              autoComplete="off"
              tabIndex={-1}
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="absolute left-[-9999px]"
              aria-hidden="true"
            />

            <div className="space-y-1">
              <label htmlFor="s-name" className="text-xs font-semibold tracking-wide text-slate-500">
                Nome completo
              </label>
              <input
                id="s-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full rounded-2xl border px-4 py-3 text-sm transition shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/80 ${
                  !isNameValid ? 'border-rose-200 focus:ring-rose-300' : 'border-slate-200'
                }`}
                placeholder="Seu nome"
                aria-invalid={!isNameValid}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="s-email" className="text-xs font-semibold tracking-wide text-slate-500">
                E-mail
              </label>
              <input
                id="s-email"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full rounded-2xl border px-4 py-3 text-sm transition shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/80 ${
                  !isEmailValid ? 'border-rose-200 focus:ring-rose-300' : 'border-slate-200'
                }`}
                placeholder="contato@empresa.com"
                aria-invalid={!isEmailValid}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="s-message" className="text-xs font-semibold tracking-wide text-slate-500">
                Mensagem (opcional)
              </label>
              <textarea
                id="s-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm transition shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/80"
                placeholder="Explique brevemente como a plataforma será utilizada."
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <a href="/login" className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition">
                Voltar ao login
              </a>
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-t-white border-gray-300" />
                    Enviando...
                  </span>
                ) : (
                  'Enviar solicitação'
                )}
              </button>
            </div>
          </form>

          <p className="mt-4 text-xs text-slate-500">
            Ao enviar, seus dados serão analisados exclusivamente para fins de aprovação interna.
          </p>
        </div>
      </section>

      <div aria-live="polite" className="pointer-events-none">
        <div className={`fixed top-6 right-6 z-50 pointer-events-auto transition duration-200 ${status === 'submitted' ? 'translate-y-0 opacity-100' : 'translate-y-[-10px] opacity-0'}`}>
          {status === 'submitted' ? (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 shadow-lg text-emerald-800 text-sm">
              <div className="font-semibold">Solicitação enviada</div>
              <p className="text-emerald-700">Você será notificado por e-mail após a avaliação.</p>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

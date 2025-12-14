"use client";

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

const highlights = [
  'Aprovação manual para proteger informações sensíveis.',
  'Acesso completo a dashboards e relatórios filtrados.',
  'Equipe dedicada para suporte e integrações.',
];

const heroStats = [
  { label: 'Painéis ativos', value: '48' },
  { label: 'Solicitações aprovadas', value: '124' },
  { label: 'Tempo médio de resposta', value: '1 dia útil' },
];

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

  const isNameValid = useMemo(() => name.trim().length >= 3, [name]);
  const isEmailValid = useMemo(() => validateEmail(email), [email]);
  const canSubmit = isNameValid && isEmailValid && status !== 'loading';

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!isNameValid) return setError('Informe um nome com pelo menos 3 caracteres.');
    if (!isEmailValid) return setError('Informe um email válido.');
    setStatus('loading');

    try {
      const response = await fetch('/api/account-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
          honeypot: honeypot.trim(),
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
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
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4">
        <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-2 text-slate-900">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/80">
              Solicitação de acesso
            </p>
            <h1 className="text-3xl font-semibold leading-tight">
              Solicite acesso seguro à plataforma de indicadores
            </h1>
            <p className="text-sm text-slate-600">
              Conte para a gente como pretende usar o sistema. Nosso time revisa todas as
              solicitações com foco na segurança e governança dos dados.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-100 bg-white/50 p-4 text-sm shadow-sm"
              >
                <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.3em] text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-2">
            {highlights.map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-slate-600">
                <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Formulário de solicitação</CardTitle>
            <CardDescription>
              Informe seu nome e email corporativo para receber um retorno em até 48 horas úteis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Erro ao enviar</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {status === 'submitted' && (
              <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900" role="status">
                <AlertTitle>Solicitação recebida</AlertTitle>
                <AlertDescription>
                  Sua solicitação foi enviada com sucesso. Vamos revisar e responder em até 48 horas úteis.
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={submit} noValidate className="space-y-4">
              <input
                type="text"
                autoComplete="off"
                tabIndex={-1}
                value={honeypot}
                onChange={(event) => setHoneypot(event.target.value)}
                className="absolute left-[-9999px] h-px w-px opacity-0"
                aria-hidden="true"
              />

              <div className="space-y-1">
                <Label htmlFor="signup-name">Nome completo</Label>
                <Input
                  id="signup-name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Seu nome completo"
                  aria-invalid={!isNameValid}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="signup-email">Email corporativo</Label>
                <Input
                  id="signup-email"
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="voce@empresa.com"
                  aria-invalid={!isEmailValid}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="signup-message">Mensagem (opcional)</Label>
                <Textarea
                  id="signup-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Explique brevemente como pretende usar o aplicativo."
                  rows={4}
                />
              </div>

              <div className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs uppercase tracking-[0.3em]">
                  Sem cobrança imediata
                </span>
                <Button type="submit" disabled={!canSubmit}>
                  {status === 'loading' ? 'Enviando...' : 'Enviar solicitação'}
                </Button>
              </div>
            </form>

            <div className="mt-2 text-center">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Voltar ao login</Link>
              </Button>
            </div>

            <p className="text-xs text-slate-500">
              Ao enviar, analisamos sua solicitação apenas para fins corporativos e de auditoria.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

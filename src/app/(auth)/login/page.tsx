'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, KeyRound, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { useAuth } from '@/hooks/use-auth';
import { useQueryClient } from '@tanstack/react-query';
import { useTracking } from '@/hooks/use-tracking';

const DEFAULT_LANDING_PAGE = '/indicators';

async function resolveLandingPage(userId?: string) {
  if (!userId) return DEFAULT_LANDING_PAGE;
  try {
    const settingsResponse = await fetch(`/api/settings?userId=${encodeURIComponent(userId)}`, {
      cache: 'no-store',
    });
    if (!settingsResponse.ok) return DEFAULT_LANDING_PAGE;
    const settings = await settingsResponse.json();
    const page = typeof settings?.defaultPage === 'string' ? settings.defaultPage : undefined;
    if (page && page.startsWith('/')) return page;
  } catch (err) {
    console.error('Failed to read user settings for landing page', err);
  }
  return DEFAULT_LANDING_PAGE;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnToParam = searchParams?.get?.('returnTo') ?? undefined;
  const { toast } = useToast();
  const { login } = useAuth();
  const { trackAction } = useTracking();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await login.mutateAsync({ email, password });
      toast({
        title: 'Login bem-sucedido!',
        description: `Bem-vindo de volta, ${user.name}.`,
      });
      trackAction('login', { email });

      try {
        if (typeof window !== 'undefined' && user?.id) {
          const payload = {
            userId: user.id,
            theme: localStorage.getItem('theme'),
            themeColor: localStorage.getItem('themeColor'),
            themeTone: localStorage.getItem('themeTone'),
          };
          fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }).catch(() => {});
        }
      } catch (e) {
        // ignore best-effort theme sync
      }

      const returnTo = searchParams?.get?.('returnTo') ?? undefined;
      const landingPage = await resolveLandingPage(user?.id);
      await queryClient.invalidateQueries({ queryKey: ['admin-session'] });
      if (returnTo && typeof returnTo === 'string' && returnTo.startsWith('/')) {
        router.push(returnTo);
      } else {
        router.push(landingPage);
      }
    } catch (err: any) {
      setError(err?.message || 'Email ou senha inválidos. Tente novamente.');
      toast({
        variant: 'destructive',
        title: 'Falha no Login',
        description: err?.message || 'Credenciais inválidas.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="relative min-h-screen w-screen max-w-full overflow-hidden border-0 bg-white text-slate-900"
      style={{
        ['--primary' as any]: '24 100% 40%',
        ['--secondary' as any]: '24 100% 40%',
        ['--muted-foreground' as any]: '214 18% 20%',
        ['--card' as any]: '0 0% 100%',
        ['--card-foreground' as any]: '214 16% 18%',
        ['--popover' as any]: '0 0% 100%',
        ['--popover-foreground' as any]: '214 16% 18%',
        ['--surface-background' as any]: '0 0% 100%',
        ['--surface-foreground' as any]: '214 16% 18%',
      } as React.CSSProperties}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0),_transparent_45%)]" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(255,255,255,0),_transparent_40%)]" aria-hidden="true" />
      <a
        href="#login-form"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:px-3 focus:py-2 focus:bg-white focus:text-slate-900 focus:rounded focus:ring focus:ring-primary/40 transition"
      >
        Ir para o formulário de login
      </a>
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
            <div className="flex flex-col items-center gap-4">
              <img src="/logo.png" alt="Pague Menos" className="h-14 w-14 object-contain" />
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-900">Entrar na plataforma</p>
              </div>
            </div>
            <div className="pt-6">
              <form id="login-form" onSubmit={handleLogin} className="space-y-6">
                {error && (
                  <Alert variant="destructive" role="alert" aria-live="assertive">
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-3">
                  <Label htmlFor="email">Email corporativo</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="voce@empresa.com"
                      required
                      className="pl-10 bg-slate-50 text-slate-900 border border-slate-300 placeholder-slate-400 rounded-lg shadow-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-primary/60"
                      style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="pl-10 pr-10 bg-slate-50 text-slate-900 border border-slate-300 placeholder-slate-400 rounded-lg shadow-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-primary/60"
                      style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      aria-describedby="password-help"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-700">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        id="remember"
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="h-4 w-4 rounded border border-slate-300 bg-white text-primary focus:ring-secondary"
                      />
                      Lembrar-me
                    </label>
                    <a
                      href={returnToParam ? `/forgot-password?returnTo=${encodeURIComponent(returnToParam)}` : '/forgot-password'}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      Esqueci a senha
                    </a>
                  </div>
                </div>
                <div className="space-y-3 text-center">
                  <Button type="submit" className="w-full font-semibold" disabled={loading}>
                    {loading ? 'Entrando...' : 'Entrar'}
                  </Button>
                  <p className="text-xs text-slate-600">Conexão segura com criptografia TLS e monitoramento de acessos.</p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

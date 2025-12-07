'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, Mail, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { useAuth } from '@/hooks/use-auth';
import { useQueryClient } from '@tanstack/react-query';
import { useTracking } from '@/hooks/use-tracking';
// logo removed per UI request

// Removed Google sign-in option per request

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams?.get?.('returnTo') ?? undefined;
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

      // Persistir tema no backend (best-effort) sem expor token em localStorage.
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
      await queryClient.invalidateQueries({ queryKey: ['admin-session'] });
      if (returnTo && typeof returnTo === 'string' && returnTo.startsWith('/')) {
        router.push(returnTo);
      } else {
        router.push('/admin-panel');
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
    <main className="min-h-screen w-full bg-slate-50 text-slate-950">
      <a
        href="#login-form"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:px-3 focus:py-2 focus:bg-white focus:text-slate-900 focus:rounded focus:ring focus:ring-primary/40 transition"
      >
        Ir para o formulário de login
      </a>
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="flex min-h-screen flex-col items-center justify-center">
        <form
          id="login-form"
          onSubmit={handleLogin}
          className="w-full max-w-xl space-y-8 text-left"
        >
          <header className="space-y-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-xl font-semibold text-secondary">
              F
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">Entrar na plataforma</h1>
            <p className="text-sm text-slate-600">
              Conecte-se ao painel único de indicadores e incidentes com segurança corporativa.
            </p>
          </header>
          {error && (
            <Alert variant="destructive" role="alert" aria-live="assertive">
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-5">
            <div className="space-y-1 text-sm">
              <Label htmlFor="email">Email corporativo</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="voce@empresa.com"
                  required
                  className="pl-10"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="pl-10 pr-10"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-secondary"
                  />
                  Lembrar-me
                </label>
                <a
                  href={returnTo ? `/forgot-password?returnTo=${encodeURIComponent(returnTo)}` : '/forgot-password'}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  Esqueci a senha
                </a>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 text-center">
            <Button type="submit" className="w-full font-semibold" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
            <div className="text-sm text-slate-600">
              <span>Precisa de acesso?</span>{' '}
              <a href="/request-account" className="font-semibold text-primary hover:underline">
                Solicitar conta
              </a>
            </div>
            <p className="text-xs text-slate-500">
              Conexão segura com criptografia TLS e monitoramento de acessos.
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}

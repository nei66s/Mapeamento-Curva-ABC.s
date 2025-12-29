'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Activity, Eye, EyeOff, KeyRound, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { useAuth } from '@/hooks/use-auth';
import { useQueryClient } from '@tanstack/react-query';
import { useTracking } from '@/hooks/use-tracking';
// logo removed per UI request

// Removed Google sign-in option per request

const highlightStats = [
  {
    title: 'Disponibilidade',
    value: '—',
    description: 'Métrica real será exibida quando o backend estiver conectado.',
    icon: ShieldCheck,
  },
  {
    title: 'Resposta Operacional',
    value: '—',
    description: 'Número ilustrativo para fins de demonstração.',
    icon: Activity,
  },
  {
    title: 'Experiência Premium',
    value: 'Fluxo único',
    description: 'Painéis, alertas e governança em um único lugar intuitivo.',
    icon: Sparkles,
  },
];

const infoTiles = [
  {
    title: 'Governança visível',
    description: 'Logs auditáveis, papéis e histórico de acesso corporativo.',
  },
  {
    title: 'Indicadores em tempo real',
    description: 'Dados da Curva A com atualizações contínuas e previsíveis.',
  },
  {
    title: 'Operações alinhadas',
    description: 'Conecte alertas a times, indicadores e planos de ação.',
  },
];

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
    <main className="relative min-h-screen w-screen max-w-full overflow-hidden border-0 bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.8),_transparent_45%)]" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(15,23,42,0.6),_transparent_40%)]" aria-hidden="true" />
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
        <div className="grid w-full max-w-6xl gap-10 lg:grid-cols-[1.2fr_0.95fr] lg:gap-12">
          <div className="flex flex-col gap-8 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-900/40 p-8 shadow-2xl shadow-primary/20">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-xl font-semibold text-white shadow-lg">
                F
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">Curva ABC</p>
                <p className="text-sm text-white/80">Indicadores + Operações</p>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.4em] text-primary/70">Nova experiência</p>
              <h1 className="text-3xl font-semibold leading-tight text-white lg:text-4xl">
                Segurança corporativa com uma jornada de acesso elegante.
              </h1>
              <p className="text-sm text-slate-200">
                Painel único com autenticação forte, trilhas de auditoria e feedback visual imediato para cada equipe autorizada.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {highlightStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.title} className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.4em] text-primary/70">
                      <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                      {stat.title}
                    </div>
                    <p className="text-2xl font-semibold text-white">{stat.value}</p>
                    <p className="text-xs text-slate-300">{stat.description}</p>
                  </div>
                );
              })}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {infoTiles.map((tile) => (
                <div key={tile.title} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
                  <p className="font-semibold text-white">{tile.title}</p>
                  <p className="text-xs text-slate-300">{tile.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex w-full flex-col items-center justify-center px-4 sm:px-6 lg:px-0">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-slate-900/80 backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-lg font-semibold text-secondary">
                    F
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-50">Entrar na plataforma</p>
                    <p className="text-xs text-slate-400">Governança, indicadores e incidentes</p>
                  </div>
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Seguro</span>
              </div>
              <form id="login-form" onSubmit={handleLogin} className="space-y-6 pt-6">
                {error && (
                  <Alert variant="destructive" role="alert" aria-live="assertive">
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-3">
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
                <div className="space-y-3">
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
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        id="remember"
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="h-4 w-4 rounded border-0 bg-slate-700 text-primary focus:ring-secondary"
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
                  <p className="text-xs text-slate-500">
                    Conexão segura com criptografia TLS e monitoramento de acessos.
                  </p>
                </div>
              </form>
              <div className="mt-6 text-center text-sm text-slate-400">
                <span>Precisa de acesso?</span>{' '}
                <a href="/request-account" className="font-semibold text-primary hover:underline">
                  Solicitar conta
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

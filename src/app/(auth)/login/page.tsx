'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, Mail, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { cloneDefaultPermissions, moduleDefinitions } from '@/lib/permissions-config';
import type { UserRole } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ThemeToggle } from '@/components/layout/theme-toggle';
// logo removed per UI request

// Removed Google sign-in option per request

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { setUser } = useCurrentUser();
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
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Login bem-sucedido!',
          description: `Bem-vindo de volta, ${data.user.name}.`,
        });
        try {
          // Persistir usuário no localStorage para uso nas páginas cliente
          // Use the shared hook to persist user state + cookie/localStorage.
          // This ensures other mounted components receive the updated user immediately.
          setUser?.(data.user);
        } catch (e) {
          // não bloquear o fluxo de login se storage falhar
          console.warn('Não foi possível salvar usuário no localStorage', e);
        }

        // Persist user theme preferences to server-side settings (best-effort)
        try {
          if (typeof window !== 'undefined' && data?.user?.id) {
            const payload = {
              userId: data.user.id,
              theme: localStorage.getItem('theme'),
              themeColor: localStorage.getItem('themeColor'),
              themeTone: localStorage.getItem('themeTone'),
            };
            // Fire-and-forget; no need to block navigation on failures
            fetch('/api/settings', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            }).catch(() => {});
          }
        } catch (e) {
          // não bloquear o fluxo de login se storage falhar
          console.warn('Não foi possível salvar usuário no localStorage', e);
        }

        // If a returnTo param exists (set by middleware or client guard), prefer it.
        try {
          const returnTo = searchParams?.get?.('returnTo') ?? undefined;
          if (returnTo && typeof returnTo === 'string' && returnTo.startsWith('/')) {
            router.push(returnTo);
            return;
          }
        } catch (e) {
          // ignore and fall through to role-based redirect
        }

        // Decide where to navigate based on role permissions. Prefer the first
        // allowed module (using server mapping when available, falling back to defaults).
        (async () => {
          try {
            const permRes = await fetch('/api/permissions');
            const permJson = await permRes.json();
            const role = data.user.role;
            const serverPerms = (permJson && permJson.permissions) || {};
            const rolePerms = serverPerms[role as UserRole] ?? cloneDefaultPermissions()[role as UserRole] ?? {};

            const firstAllowed = moduleDefinitions.find((m) => rolePerms[m.id]);

            const routeForModule = (id: string) => {
              // Prefer new top-level routes where available. Keep legacy /dashboard/* only as fallback.
              switch (id) {
                case 'indicators': return '/indicators';
                case 'releases': return '/releases';
                case 'incidents': return '/incidents';
                case 'rncs': return '/rncs';
                case 'categories': return '/categories';
                case 'matrix': return '/matrix';
                case 'compliance': return '/compliance';
                case 'suppliers': return '/suppliers';
                case 'warranty': return '/warranty';
                case 'tools': return '/tools';
                case 'settlement': return '/settlement';
                case 'profile': return '/profile';
                case 'settings': return '/settings';
                case 'about': return '/';
                default: return '/indicators';
              }
            };

            const target = firstAllowed ? routeForModule(firstAllowed.id) : '/indicators';
            router.push(target);
          } catch (e) {
            router.push('/dashboard');
          }
        })();
      } else {
        setError(data.error || 'Email ou senha inválidos. Tente novamente.');
        toast({
          variant: 'destructive',
          title: 'Falha no Login',
          description: data.error || 'Credenciais inválidas.',
        });
      }
    } catch (error) {
      setError('Erro ao conectar com o servidor. Tente novamente.');
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao conectar com o servidor.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 px-4 py-10 overflow-hidden flex items-center justify-center">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 opacity-90" />
      <div className="absolute left-[-10%] top-20 h-72 w-72 rounded-full bg-primary/70 blur-3xl" />
      <div className="absolute right-[-5%] bottom-10 h-64 w-64 rounded-full bg-cyan-500/60 blur-3xl" />

      <div className="relative mx-auto flex max-w-5xl flex-col gap-6 lg:grid lg:grid-cols-[1.05fr,0.95fr] items-center">
        <div className="w-full rounded-[32px] border border-white/10 bg-muted/5 p-10 shadow-2xl backdrop-blur-lg text-white">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/10 text-2xl font-semibold">
              F
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-200">Mapeamento ABC</p>
              <h1 className="mt-1 text-3xl font-semibold leading-tight text-white">
                Controle completo sobre a curva ABC do seu estoque.
              </h1>
            </div>
          </div>
          <p className="mt-6 text-sm text-white/80">
            Planeje compras, monitorar indicadores críticos e identifique tendências antes que elas impactem o negócio.
            Tudo isso com segurança e performance corporativa.
          </p>

          <div className="mt-8 grid gap-4 text-sm">
            <div className="flex gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/10 text-lg font-semibold text-white">
                01
              </span>
              <div>
                <p className="font-semibold">Insights guiados por dados</p>
                <p className="text-white/70">Todos os indicadores atualizados em tempo real.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/10 text-lg font-semibold text-white">
                02
              </span>
              <div>
                <p className="font-semibold">Experiência colaborativa</p>
                <p className="text-white/70">Controle de acessos e módulos orientados por perfis.</p>
              </div>
            </div>
              <div className="flex gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/10 text-lg font-semibold text-white">
                03
              </span>
              <div>
                <p className="font-semibold">Segurança ativa</p>
                <p className="text-white/70">Criptografia e auditoria para acessar apenas o que importa.</p>
              </div>
            </div>
          </div>
        </div>

        <Card className="w-full rounded-[28px] border border-white/20 bg-card/90 shadow-2xl">
          <CardHeader className="text-center space-y-2 pt-8">
            <div className="flex justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-900 text-2xl font-semibold text-white">
                F
              </span>
            </div>
            <CardTitle className="text-2xl font-semibold text-foreground">Entrar na plataforma</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Conecte-se para continuar acompanhando indicadores e incidentes.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-5">
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-1">
                <Label htmlFor="email">Email corporativo</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="voce@empresa.com"
                    required
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="pl-10 pr-10"
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
                  <div className="flex items-center gap-2">
                    <input
                      id="remember"
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-secondary"
                    />
                    <label htmlFor="remember" className="text-sm select-none text-muted-foreground">
                      Lembrar-me
                    </label>
                  </div>
                  <a href="#" className="text-sm font-semibold text-primary hover:underline">Esqueci a senha</a>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 p-6 pt-0">
              <Button type="submit" className="w-full font-semibold" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                <span>Precisa de acesso? </span>
                <a href="/signup" className="font-semibold text-primary hover:underline">Solicitar conta</a>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Autenticação segura com criptografia TLS e monitoramento de acessos.
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

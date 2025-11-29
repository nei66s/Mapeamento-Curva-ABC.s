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
    <div className="relative min-h-screen bg-slate-950 px-4 py-10 overflow-hidden flex items-center justify-center">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 opacity-90" />
      <div className="absolute left-[-10%] top-20 h-72 w-72 rounded-full bg-primary/70 blur-3xl" />
      <div className="absolute right-[-5%] bottom-10 h-64 w-64 rounded-full bg-cyan-500/60 blur-3xl" />

      <div className="relative mx-auto flex max-w-5xl flex-col gap-6 lg:grid lg:grid-cols-[1.05fr,0.95fr] items-center">
        <div className="w-full rounded-lg border border-white/10 bg-muted/5 p-10 shadow-md backdrop-blur-lg text-white">
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

        <Card className="w-full rounded-lg border border-white/20 bg-card/90 shadow-md">
          <CardHeader className="text-center space-y-2 pt-8">
            <div className="flex justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-900 text-2xl font-semibold text-white">
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

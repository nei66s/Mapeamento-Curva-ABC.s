'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { KeyRound, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { cloneDefaultPermissions, moduleDefinitions } from '@/lib/permissions-config';
import type { UserRole } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
// logo removed per UI request

// Removed Google sign-in option per request

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { setUser } = useCurrentUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center items-center gap-3">
            <CardTitle className="text-3xl font-bold font-headline">
              Fixly
            </CardTitle>
          </div>
          <CardDescription>
            Faça login para acessar a plataforma
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  required
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full font-bold" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
            {/* Social login removed */}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

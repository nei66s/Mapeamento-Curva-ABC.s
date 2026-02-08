"use client";

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/use-current-user';
import { cloneDefaultPermissions } from '@/lib/permissions-config';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdminSession } from '@/hooks/use-admin-session';
import { useAuthStore } from '@/lib/auth/store';

export default function RequirePermission({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useCurrentUser();
  const authStatus = useAuthStore((s) => s.status);
  const { data: session, isLoading: sessionLoading, isError: sessionError } = useAdminSession();

  // derive moduleId from pathname
  const getModuleId = (path: string | null | undefined) => {
    if (!path) return undefined;
    // support both legacy /dashboard/* and new top-level routes
    if (path.startsWith('/dashboard/indicators') || path.startsWith('/indicators')) return 'indicators';
    if (path.startsWith('/dashboard/releases') || path.startsWith('/releases')) return 'releases';
    if (path.startsWith('/dashboard/incidents') || path.startsWith('/incidents')) return 'incidents';
    if (path.startsWith('/dashboard/rncs') || path.startsWith('/rncs')) return 'rncs';
    if (path.startsWith('/dashboard/categories') || path.startsWith('/categories')) return 'categories';
    if (path.startsWith('/dashboard/matrix') || path.startsWith('/matrix')) return 'matrix';
    if (path.startsWith('/dashboard/compliance') || path.startsWith('/compliance')) return 'compliance';
    if (path.startsWith('/dashboard/suppliers') || path.startsWith('/suppliers')) return 'suppliers';
    if (path.startsWith('/dashboard/warranty') || path.startsWith('/warranty')) return 'warranty';
    if (path.startsWith('/dashboard/tools') || path.startsWith('/tools')) return 'tools';
    if (path.startsWith('/dashboard/vacations') || path.startsWith('/vacations')) return 'vacations';
    if (path.startsWith('/dashboard/settlement') || path.startsWith('/settlement')) return 'settlement';
    if (path.startsWith('/dashboard/profile')) return 'profile';
    if (path.startsWith('/dashboard/settings') || path.startsWith('/settings')) return 'settings';
    if (path.startsWith('/admin-panel/audit')) return 'admin-audit';
    if (path.startsWith('/admin-panel/analytics')) return 'admin-analytics';
    if (path.startsWith('/admin-panel/modules')) return 'admin-modules';
    if (path.startsWith('/admin-panel/integrations')) return 'admin-integrations';
    if (path.startsWith('/admin-panel/users')) return 'admin-users';
    if (path.startsWith('/admin-panel/config')) return 'admin-config';
    if (path.startsWith('/admin-panel/health')) return 'admin-health';
    if (path.startsWith('/admin-panel')) return 'admin-dashboard';
    return undefined;
  };

  const moduleId = getModuleId(pathname);

  // Do not return early here: hooks must be registered in the same order every render.
  // We'll perform the early-return after all hooks/effects are registered below.

  const role = user?.role ?? 'visualizador';
  const defaults = cloneDefaultPermissions();
  const mId = moduleId as string | undefined;
  const sessionPerm = mId && session?.permissions ? session.permissions[mId] : undefined;
  const fallbackPerm = mId ? defaults[role]?.[mId] : true;
  const allowed = Boolean(sessionPerm ?? fallbackPerm);
  const isModuleDisabled = moduleId && session?.activeModules ? session.activeModules[moduleId] === false : false;
  const isAdminModule = moduleId?.startsWith('admin-');
  const canRender = allowed && !isModuleDisabled;
  // Always register the redirect effect in the same hook order.
  // Effect will early-return when not applicable to avoid changing behavior.
  useEffect(() => {
    console.debug('[RequirePermission] effect start', { loading, authStatus, sessionLoading, sessionError, moduleId, user: user ? { id: user.id, role: user.role } : null });
    if (loading) return; // wait for localStorage user
    // also wait while global auth bootstrap is running (server-side cookie check)
    if (authStatus === 'authenticating' || authStatus === 'idle') return;
    if (sessionError && isAdminModule) return; // avoid redirect while showing error state
    if (!moduleId) return; // no module mapping, allow access
    if (isAdminModule && sessionLoading) return; // wait module status for admin areas
    // if logout is in progress, skip client-side redirects to avoid double navigation
    if (typeof window !== 'undefined' && (window as any).__pm_logging_out) return;
    // if no user, force login
    if (!user) {
      console.debug('[RequirePermission] no user -> redirecting to login', { pathname });
      if (!pathname || pathname === '/login') return;
      // include returnTo so user can be redirected back after successful login
      try {
        router.replace('/login?returnTo=' + encodeURIComponent(pathname));
      } catch (e) {
        router.replace('/login');
      }
      return;
    }
    if (canRender) return; // user allowed, no redirect
    if (isModuleDisabled) {
      router.replace(isAdminModule ? '/admin-panel/modules' : '/indicators');
      return;
    }
    // prevent endless redirect if already in root area or already on indicators
    if (!pathname) return;
    if (pathname === '/' || pathname.startsWith('/indicators') || pathname.startsWith('/dashboard/indicators')) return;
    router.replace('/indicators');
  }, [loading, moduleId, canRender, isModuleDisabled, isAdminModule, sessionLoading, sessionError, pathname, router, user]);

  // Now that hooks and effects are registered consistently, apply the same
  // early-return logic that previously existed.
  if (loading) return null; // while we know user
  // If a logout is in progress, don't render any protected UI (avoids flash)
  if (typeof window !== 'undefined' && (window as any).__pm_logging_out) return null;
  // if moduleId not mapped, allow access
  if (moduleId?.startsWith('admin-') && sessionLoading) return null;
  if (sessionError && moduleId?.startsWith('admin-')) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Validação de módulo falhou</CardTitle>
          <CardDescription>Não foi possível confirmar se o módulo está ativo.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={() => router.replace('/admin-panel/modules')}>Ver módulos</Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  if (!moduleId) return <>{children}</>;
  if (isModuleDisabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Módulo inativo</CardTitle>
          <CardDescription>Este módulo foi desativado nas configurações.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={() => router.replace(isAdminModule ? '/admin-panel/modules' : '/indicators')}>Ver módulos</Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  if (canRender) return <>{children}</>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acesso Negado</CardTitle>
        <CardDescription>Você não tem permissão para acessar esta área.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button onClick={() => router.replace('/indicators')}>Ir para Painel</Button>
        </div>
      </CardContent>
    </Card>
  );
}

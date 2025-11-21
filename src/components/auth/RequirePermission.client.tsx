"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/use-current-user';
import { cloneDefaultPermissions } from '@/lib/permissions-config';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function RequirePermission({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useCurrentUser();
  const [perms, setPerms] = useState<Record<string, Record<string, boolean>> | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/permissions');
        if (!res.ok) throw new Error('failed');
        const json = await res.json();
        if (mounted && json && json.permissions) setPerms(json.permissions);
      } catch (e) {
        if (mounted) setPerms(cloneDefaultPermissions() as any);
      }
    })();
    return () => { mounted = false };
  }, []);

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
    if (path.startsWith('/dashboard/profile') || path.startsWith('/profile')) return 'profile';
    if (path.startsWith('/dashboard/settings') || path.startsWith('/settings')) return 'settings';
    return undefined;
  };

  const moduleId = getModuleId(pathname);

  // Do not return early here: hooks must be registered in the same order every render.
  // We'll perform the early-return after all hooks/effects are registered below.

  const role = user?.role;

  const mId = moduleId as string | undefined;
  const allowed = user
    ? ((mId ? perms?.[role ?? 'visualizador']?.[mId] : undefined) ?? (mId ? cloneDefaultPermissions()[role ?? 'visualizador']?.[mId] : undefined) ?? false)
    : false;
  // Always register the redirect effect in the same hook order.
  // Effect will early-return when not applicable to avoid changing behavior.
  useEffect(() => {
    if (loading) return; // wait for user
    if (!moduleId) return; // no module mapping, allow access
    // if logout is in progress, skip client-side redirects to avoid double navigation
    if (typeof window !== 'undefined' && (window as any).__pm_logging_out) return;
    // if no user, force login
    if (!user) {
      if (!pathname || pathname === '/login') return;
      // include returnTo so user can be redirected back after successful login
      try {
        router.replace('/login?returnTo=' + encodeURIComponent(pathname));
      } catch (e) {
        router.replace('/login');
      }
      return;
    }
    if (allowed) return; // user allowed, no redirect
    // prevent endless redirect if already in root area or already on indicators
    if (!pathname) return;
    if (pathname === '/' || pathname.startsWith('/indicators') || pathname.startsWith('/dashboard/indicators')) return;
    router.replace('/indicators');
  }, [loading, moduleId, allowed, pathname, router]);

  // Now that hooks and effects are registered consistently, apply the same
  // early-return logic that previously existed.
  if (loading) return null; // while we know user
  // If a logout is in progress, don't render any protected UI (avoids flash)
  if (typeof window !== 'undefined' && (window as any).__pm_logging_out) return null;
  // if moduleId not mapped, allow access
  if (!moduleId) return <>{children}</>;
  if (allowed) return <>{children}</>;

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

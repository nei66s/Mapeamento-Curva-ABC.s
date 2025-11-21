"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { moduleDefinitions } from '@/lib/permissions-config';
import { useCurrentUser } from '@/hooks/use-current-user';

type ModuleMeta = {
  id: string;
  label: string;
};

function resolveModuleMeta(pathname: string): ModuleMeta | null {
  const segments = pathname.split('/').filter(Boolean);
  for (const segment of segments) {
    const match = moduleDefinitions.find((module) => module.id === segment);
    if (match) {
      return match;
    }
  }
  return null;
}

export function ActivityTracker() {
  const { user } = useCurrentUser();
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (user?.id && user.id !== userIdRef.current) {
      userIdRef.current = user.id;
      lastPathRef.current = null;
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !pathname) {
      return;
    }
    if (lastPathRef.current === pathname) {
      return;
    }
    lastPathRef.current = pathname;
    const moduleMeta = resolveModuleMeta(pathname);
    const log = async () => {
      try {
        const historyRes = await fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            pathname,
            module: moduleMeta?.label,
            action: moduleMeta ? `Acessou ${moduleMeta.label}` : 'Acessou uma página',
            details: { moduleId: moduleMeta?.id ?? null },
          }),
        });
        if (!historyRes.ok) {
          const payload = await historyRes.json().catch(() => null);
          throw new Error(payload?.error ?? 'Falha ao registrar histórico');
        }
      } catch (error) {
        console.error('Falha ao registrar histórico de navegação', error);
      }
    };
    void log();
  }, [pathname, user?.id]);

  return null;
}

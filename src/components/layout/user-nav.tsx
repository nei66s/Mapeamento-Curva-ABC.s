"use client";

import { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from 'next/link';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useRouter } from 'next/navigation';

export function UserNav() {
  const { user, setUser } = useCurrentUser();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    // No-op: synchronization is handled centrally by CurrentUserProvider.
    return () => {};
  }, [setUser]);

  return (
    <>
      {isLoggingOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="flex flex-col items-center gap-4 rounded-md bg-white/5 px-6 py-5 backdrop-blur-md">
            <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
            <div className="text-sm text-white">Finalizando logout...</div>
          </div>
        </div>
      )}
      <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="overflow-hidden rounded-full"
        >
          <Avatar className="h-8 w-8">
            {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt="User avatar" data-ai-hint="person avatar"/>}
            <AvatarFallback>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
    <Link href="/profile" passHref>
      <DropdownMenuItem>Perfil</DropdownMenuItem>
    </Link>
    <Link href="/settings" passHref>
      <DropdownMenuItem>Configurações</DropdownMenuItem>
    </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            // Mark global flag and show logout overlay immediately
            try { (window as any).__pm_logging_out = true; } catch (e) {}
            setIsLoggingOut(true);

            // Immediately clear client-side auth state to avoid any flash
            try { setUser(null); } catch (e) {}
            try { localStorage.removeItem('pm_user'); } catch (e) {}
            try { window.dispatchEvent(new CustomEvent('pm_user_changed', { detail: null })); } catch (e) {}
            try { document.cookie = 'pm_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'; } catch (e) {}

            // Attempt to notify server to clear session, but don't block longer than 3s.
            try {
              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 3000);
              try {
                // debug log
                try { console.log('[logout] sending POST /api/logout'); } catch (e) {}
                await fetch('/api/logout', { method: 'POST', signal: controller.signal });
                try { console.log('[logout] server responded'); } catch (e) {}
              } catch (e) {
                // ignore fetch errors/timeouts
                try { console.log('[logout] fetch failed or timed out', e); } catch (err) {}
              }
              clearTimeout(timeout);
            } catch (e) {}

            // Use full-page navigation to /login to avoid duplicate client-side
            // app-router navigations which can produce two GETs for the same path.
            try { console.log('[logout] navigating to /login'); } catch (e) {}
            try { window.location.replace('/login'); } catch (e) { try { router.replace('/login'); } catch (err) {} }
          }}
        >
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </>
  );
}

"use client";

import { useEffect } from 'react';
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

export function UserNav() {
  const { user, setUser } = useCurrentUser();

  useEffect(() => {
    const handleStorage = () => {
      try {
        const raw = localStorage.getItem('pm_user');
        if (raw) {
          setUser(JSON.parse(raw));
        } else {
          setUser(null);
        }
      } catch (err) {
        console.warn('Failed to sync pm_user from storage', err);
      }
    };

    const handlePmUserChanged = (ev: Event) => {
      try {
        const detail = (ev as CustomEvent).detail;
        if (detail) setUser(detail as any);
        else setUser(null);
      } catch (e) {}
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
      window.addEventListener('pm_user_changed', handlePmUserChanged as EventListener);
      return () => {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener('pm_user_changed', handlePmUserChanged as EventListener);
      };
    }
    return () => {};
  }, [setUser]);

  return (
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
         <Link href="/login" passHref>
            <DropdownMenuItem>Sair</DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

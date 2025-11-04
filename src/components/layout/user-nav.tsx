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
import { mockUsers } from "@/lib/users";
import Link from 'next/link';

export function UserNav() {
  // Start with undefined so server and initial client render match
  const [user, setUser] = useState<any | undefined>(undefined);

  useEffect(() => {
    // keep in sync if localStorage changes in the session
    try {
      const handleStorage = () => {
        try {
          const raw = localStorage.getItem('pm_user');
          if (raw) {
            setUser(JSON.parse(raw));
            return;
          }
        } catch (e) {
          // ignore parse errors
        }

        // Fallback for dev: use mockUsers only after mount (so it doesn't affect SSR)
        const fallback = mockUsers.find((u) => u.role === 'admin');
        if (fallback) setUser(fallback);
      };

      // Read once on mount (no storage event fires in same window)
      handleStorage();

      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    } catch (e) {
      // ignore
    }
  }, []);

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
            <AvatarFallback>{user ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
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
        <Link href="/dashboard/profile" passHref>
            <DropdownMenuItem>Perfil</DropdownMenuItem>
        </Link>
        <Link href="/dashboard/settings" passHref>
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

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, LineChart, MapPin, Settings, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/indicators', label: 'Indicadores', icon: LineChart },
  { href: '/incidents', label: 'Execução', icon: Activity },
  { href: '/matrix', label: 'Mapeamento', icon: MapPin },
  { href: '/profile', label: 'Perfil', icon: UserIcon },
  { href: '/settings', label: 'Ajustes', icon: Settings },
];

interface MobileNavProps {
  className?: string;
}

export default function MobileBottomNav({ className }: MobileNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/indicators') {
      return pathname === '/indicators' || pathname === '/';
    }
    return pathname?.startsWith(href);
  };

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 px-4 py-2 backdrop-blur-xl shadow-[0_-24px_60px_rgba(15,23,42,0.35)] mobile-bottom-nav',
        className
      )}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1 text-[0.65rem] font-semibold transition',
              isActive(item.href)
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
            aria-current={isActive(item.href) ? 'page' : undefined}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

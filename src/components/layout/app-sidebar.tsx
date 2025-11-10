'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Settings,
  LineChart,
  Info,
  CalendarDays,
  Activity,
  FileWarning,
  ClipboardPaste,
  FileScan,
  ListCollapse,
  Grid3x3,
  ClipboardCheck,
  Users,
  ShieldCheck,
  Construction,
  Handshake,
  ArchiveX,
  User as UserIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/hooks/use-current-user';
import { cloneDefaultPermissions } from '@/lib/permissions-config';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { LogoImage } from '../icons/logo-image';
import { usePathname } from 'next/navigation';

const mainLinks = [
  { href: '/indicators', icon: LineChart, label: 'Indicadores', section: 'main', moduleId: 'indicators' },
];

const executionLinks = [
  { href: "/incidents", icon: Activity, label: "Incidentes", moduleId: 'incidents' },
  { href: "/rncs", icon: FileWarning, label: "Registros de Não Conformidade", moduleId: 'rncs' },
  { href: "/releases", icon: ClipboardPaste, label: "Lançamentos", moduleId: 'releases' },
  { href: "/technical-evaluation", icon: FileScan, label: "Gerar Laudo Técnico" },
];

const mappingLinks = [
  { href: "/categories", icon: ListCollapse, label: "Categorias", moduleId: 'categories' },
  { href: "/matrix", icon: Grid3x3, label: "Matriz de Itens", moduleId: 'matrix' },
];

const preventiveLinks = [
  { href: "/compliance", icon: ClipboardCheck, label: "Preventivas", moduleId: 'compliance' },
];

const resourcesLinks = [
  { href: "/suppliers", icon: Users, label: "Fornecedores", moduleId: 'suppliers' },
  { href: "/warranty", icon: ShieldCheck, label: "Garantias", moduleId: 'warranty' },
  { href: "/tools", icon: Construction, label: "Almoxarifado", moduleId: 'tools' },
  { href: "/settlement", icon: Handshake, label: "Quitação", moduleId: 'settlement' },
  { href: "/unsalvageable", icon: ArchiveX, label: "Itens Inservíveis" },
];

const secondaryLinks = [
  { href: '/vacations', icon: CalendarDays, label: 'Gestão de Férias', moduleId: 'tools' },
]

const allLinksGroups = [
    mainLinks,
    executionLinks,
    mappingLinks,
    preventiveLinks,
    resourcesLinks,
    secondaryLinks
];

const bottomLinks = [
  { href: '/profile', icon: UserIcon, label: 'Meu Perfil', moduleId: 'profile' },
  { href: '/settings', icon: Settings, label: 'Configurações', moduleId: 'settings' },
  { href: '/admin/users', icon: Users, label: 'Usuários' },
  { href: '/admin', icon: Info, label: 'Administração' },
];

export default function AppSidebar() {
  const pathname = usePathname();
  // Hide sidebar on auth pages (login/register) — those live under the (auth) route group
  if (pathname && pathname.startsWith('/login')) return null;
  const { user } = useCurrentUser();
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
        if (mounted) {
          const defaults = cloneDefaultPermissions();
          setPerms(defaults as any);
        }
      }
    })();
    return () => { mounted = false };
  }, []);

  const isActive = (href: string) => {
    if (href === '/indicators') {
      return pathname === '/indicators' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const canAccess = (moduleId?: string) => {
    if (!moduleId) return true;
    const role = user?.role ?? 'visualizador';
    if (perms && perms[role] && typeof perms[role][moduleId] !== 'undefined') {
      return Boolean(perms[role][moduleId]);
    }
    const defaults = cloneDefaultPermissions();
    return Boolean(defaults[role]?.[moduleId]);
  };

  // Build groups filtered by access so we don't render empty groups/dividers
  const visibleGroups = allLinksGroups.map(group => group.filter(link => canAccess((link as any).moduleId)));
  const renderedGroups = visibleGroups.filter(g => g.length > 0);

  return (
    <TooltipProvider delayDuration={0}>
      {/* Fixed narrow sidebar: make the main nav scrollable when items overflow */}
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-16 flex-col border-r bg-card sm:flex overflow-hidden">
        <nav className="flex flex-1 flex-col items-center gap-2 px-2 py-2 sm:py-4 overflow-y-auto">
          <Link
            href="/"
            className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full text-lg font-semibold text-primary-foreground md:h-12 md:w-12 md:text-base mb-2"
          >
            <LogoImage className="h-8 w-8 transition-all group-hover:scale-110" />
            <span className="sr-only">Fixly</span>
          </Link>

          {renderedGroups.map((group, gIndex) => (
            <React.Fragment key={gIndex}>
              {gIndex > 0 && <div className="h-[1px] w-full bg-border my-1" />}
              {group.map((link) => (
                <Tooltip key={link.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={link.href}
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-primary hover:bg-muted',
                        isActive(link.href) && 'bg-primary/10 text-primary'
                      )}
                    >
                      <link.icon className="h-5 w-5" />
                      <span className="sr-only">{link.label}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{link.label}</TooltipContent>
                </Tooltip>
              ))}
            </React.Fragment>
          ))}
        </nav>
  <nav className="mt-auto flex flex-col items-center gap-2 px-2 sm:py-4">
           {bottomLinks.map(link => (
                canAccess((link as any).moduleId) && (
                <Tooltip key={link.href}>
                <TooltipTrigger asChild>
                    <Link
                    href={link.href}
                    className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-primary hover:bg-muted',
                        isActive(link.href) && 'bg-primary/10 text-primary'
                    )}
                    >
                    <link.icon className="h-5 w-5" />
                    <span className="sr-only">{link.label}</span>
                    </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{link.label}</TooltipContent>
                </Tooltip>
                )
            ))}
        </nav>
      </aside>
    </TooltipProvider>
  );
}

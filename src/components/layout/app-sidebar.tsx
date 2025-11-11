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
  MapPin,
  X,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
// logo removed per UI request
import { useCurrentUser } from '@/hooks/use-current-user';
import { cloneDefaultPermissions } from '@/lib/permissions-config';
// logo removed per UI request
import { usePathname } from 'next/navigation';

const mainLinks = [
  { href: '/indicators', icon: LineChart, label: 'Indicadores', section: 'main', moduleId: 'indicators' },
];

const executionLinks = [
  { href: '/incidents', icon: Activity, label: 'Incidentes', moduleId: 'incidents' },
  { href: '/rncs', icon: FileWarning, label: 'Registros de Não Conformidade', moduleId: 'rncs' },
  { href: '/releases', icon: ClipboardPaste, label: 'Lançamentos', moduleId: 'releases' },
  { href: '/technical-evaluation', icon: FileScan, label: 'Gerar Laudo Técnico' },
];

const mappingLinks = [
  { href: '/categories', icon: ListCollapse, label: 'Categorias', moduleId: 'categories' },
  { href: '/matrix', icon: Grid3x3, label: 'Matriz de Itens', moduleId: 'matrix' },
];

const preventiveLinks = [
  { href: '/compliance', icon: ClipboardCheck, label: 'Preventivas', moduleId: 'compliance' },
];

const resourcesLinks = [
  { href: '/stores', icon: MapPin, label: 'Lojas' },
  { href: '/suppliers', icon: Users, label: 'Fornecedores', moduleId: 'suppliers' },
  { href: '/warranty', icon: ShieldCheck, label: 'Garantias', moduleId: 'warranty' },
  { href: '/tools', icon: Construction, label: 'Almoxarifado', moduleId: 'tools' },
  { href: '/settlement', icon: Handshake, label: 'Quitação', moduleId: 'settlement' },
  { href: '/unsalvageable', icon: ArchiveX, label: 'Itens Inservíveis' },
];

const secondaryLinks = [
  { href: '/vacations', icon: CalendarDays, label: 'Gestão de Férias', moduleId: 'tools' },
];

const linkGroups = [
  { title: 'Principais', links: mainLinks },
  { title: 'Execução', links: executionLinks },
  { title: 'Mapeamento', links: mappingLinks },
  { title: 'Preventivas', links: preventiveLinks },
  { title: 'Recursos', links: resourcesLinks },
  { title: 'Utilitários', links: secondaryLinks },
];

const bottomLinks = [
  { href: '/profile', icon: UserIcon, label: 'Meu Perfil', moduleId: 'profile' },
  { href: '/settings', icon: Settings, label: 'Configurações', moduleId: 'settings' },
  { href: '/admin/users', icon: Users, label: 'Usuários' },
  { href: '/admin', icon: Info, label: 'Administração' },
];

interface AppSidebarProps {
  visible: boolean;
  onRequestClose?: () => void;
}

export default function AppSidebar({ visible, onRequestClose }: AppSidebarProps) {
  const pathname = usePathname();
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
    return pathname?.startsWith(href);
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

  const visibleGroups = linkGroups.map(group => ({
    ...group,
    links: group.links.filter(link => canAccess(link.moduleId)),
  }));
  const renderedGroups = visibleGroups.filter(group => group.links.length > 0);
  const totalVisibleLinks = renderedGroups.reduce((total, group) => total + group.links.length, 0);

  const heroStats = [
    { label: 'Módulos liberados', value: `${totalVisibleLinks}`, helper: `${renderedGroups.length} categorias` },
    { label: 'Atualização', value: 'Em tempo real', helper: 'sincronização contínua' },
  ];
  const sidebarClasses = cn(
    'fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-white/10 bg-gradient-to-br from-primary/90 via-secondary/70 to-secondary/40 text-white shadow-2xl backdrop-blur-sm transition-transform duration-300 sm:flex',
    visible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'
  );

  return (
    <aside className={sidebarClasses} aria-hidden={!visible ? 'true' : 'false'}>
      <div className="flex h-full flex-col">
        <div className="px-4 pb-4 pt-6">
          {/* Compact header: simpler look without heavy gradient/shadow */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 text-white">
              <div className="flex flex-col leading-tight">
                <span className="text-[0.65rem] uppercase tracking-[0.3em] text-white/80">Fixly</span>
                <span className="text-sm font-semibold">Gestão</span>
              </div>
            </Link>
            {onRequestClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRequestClose}
                className="ml-auto text-white/70 hover:text-white"
                aria-label="Ocultar painel lateral"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="mt-3">
            <p className="text-sm font-medium text-white">{user?.name ?? 'Equipe de Manutenção'}</p>
            <p className="text-xs text-white/60">{user?.role ? `Perfil ${user.role}` : 'Operador ativo'}</p>
          </div>
        </div>
        <ScrollArea className="flex-1 px-3 py-2">
          <div className="space-y-5">
            {renderedGroups.map(group => (
              <div key={group.title} className="space-y-2">
                <p className="px-2 text-[0.63rem] uppercase tracking-[0.4em] text-white/50">{group.title}</p>
                <div className="space-y-1">
                  {group.links.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        'flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm font-semibold transition',
                        isActive(link.href)
                          ? 'border-white/20 bg-white/10 text-white'
                          : 'border-transparent text-white/80 hover:border-white/20 hover:bg-white/5 hover:text-white'
                      )}
                    >
                      <link.icon className="h-5 w-5" />
                      <span>{link.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="border-t border-white/10 px-4 py-4">
          <div className="space-y-1">
            {bottomLinks.map(link => canAccess(link.moduleId) && (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm font-semibold transition',
                  isActive(link.href)
                    ? 'border-white/30 bg-white/10 text-white shadow-[0_8px_30px_rgba(2,6,23,0.35)]'
                    : 'border-transparent text-white/70 hover:border-white/20 hover:bg-white/5 hover:text-white'
                )}
              >
                <link.icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

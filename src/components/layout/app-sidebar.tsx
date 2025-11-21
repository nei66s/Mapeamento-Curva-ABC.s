'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Settings,
  LineChart,
  Calculator,
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
  Layers,
  User as UserIcon,
  MapPin,
  ListChecks,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
// logo removed per UI request
import { useCurrentUser } from '@/hooks/use-current-user';
import { cloneDefaultPermissions } from '@/lib/permissions-config';
// logo removed per UI request
import { usePathname } from 'next/navigation';
import { SidebarDemandCard } from '@/components/layout/sidebar-demand-card';
import { SidebarSeasonCard } from '@/components/layout/sidebar-season-card';

const mainLinks = [
  { href: '/indicators', icon: LineChart, label: 'Indicadores', section: 'main', moduleId: 'indicators' },
];

const executionLinks = [
  { href: '/incidents', icon: Activity, label: 'Incidentes', moduleId: 'incidents' },
  { href: '/rncs', icon: FileWarning, label: 'Registros de Não Conformidade', moduleId: 'rncs' },
  { href: '/releases', icon: ClipboardPaste, label: 'Lançamentos', moduleId: 'releases' },
  { href: '/dashboard/gerar-laudo-tecnico', icon: FileScan, label: 'Gerar Laudo Técnico', moduleId: 'laudos' },
];

const mappingLinks = [
  { href: '/categories', icon: ListCollapse, label: 'Categorias', moduleId: 'categories' },
  { href: '/matrix', icon: Grid3x3, label: 'Matriz de Itens', moduleId: 'matrix' },
  { href: '/escopos', icon: ListChecks, label: 'Escopos', moduleId: 'escopos' },
];

const preventiveLinks = [
  { href: '/compliance', icon: ClipboardCheck, label: 'Preventivas', moduleId: 'compliance' },
];

const assetsLinks = [
  { href: '/assets', icon: Layers, label: 'Cadastro de Ativos', moduleId: 'assets' },
  { href: '/assets/controle', icon: ClipboardCheck, label: 'Controle de Ativos', moduleId: 'assets' },
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
  { href: '/price-simulator', icon: Calculator, label: 'Simulador de Preços' },
  { href: '/vacations', icon: CalendarDays, label: 'Gestão de Férias', moduleId: 'vacations' },
];

const linkGroups = [
  { title: 'Principais', links: mainLinks },
  { title: 'Execução', links: executionLinks },
  { title: 'Mapeamento', links: mappingLinks },
  { title: 'Ativos', links: assetsLinks },
  { title: 'Preventivas', links: preventiveLinks },
  { title: 'Recursos', links: resourcesLinks },
  { title: 'Utilitários', links: secondaryLinks },
];

const bottomLinks = [
  { href: '/profile', icon: UserIcon, label: 'Meu Perfil', moduleId: 'profile' },
  { href: '/settings', icon: Settings, label: 'Configurações', moduleId: 'settings' },
  { href: '/admin/users', icon: Users, label: 'Usuários', moduleId: 'users' },
  { href: '/admin', icon: Info, label: 'Administração', moduleId: 'administration' },
];

interface AppSidebarProps {
  visible: boolean;
  onRequestClose?: () => void;
}

export default function AppSidebar({ visible, onRequestClose }: AppSidebarProps) {
  const pathname = usePathname();
  const { user, loading } = useCurrentUser();
  const [perms, setPerms] = useState<Record<string, Record<string, boolean>> | null>(null);

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Read persisted collapsed state on client after hydration to avoid
  // server/client markup mismatch during SSR.
  useEffect(() => {
    try {
      const raw = localStorage.getItem('sidebarCollapsedGroups');
      if (raw) {
        setCollapsedGroups(JSON.parse(raw));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const toggleGroup = (title: string) => {
    setCollapsedGroups(prev => {
      const next = { ...(prev || {}), [title]: !prev?.[title] };
      try { localStorage.setItem('sidebarCollapsedGroups', JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };

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
    // Admin should always see the administration page regardless of stored permissions
    if (moduleId === 'administration' && role === 'admin') return true;
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

  const sidebarClasses = cn(
    // use the theme hero gradient so the sidebar matches HeroPanel look and tone
    // use semantic foreground so text adapts to light/dark themes
    'hero-gradient text-foreground shadow-lg border-r border-border/20 transition-transform duration-300',
    // fixed on all breakpoints so content padding (lg:pl-[18rem]) aligns correctly
    'fixed inset-y-0 left-0 z-50 w-72 lg:w-72 lg:z-50',
    // slide in/out and respect visibility on all breakpoints
    visible ? 'translate-x-0' : '-translate-x-full'
  );

  const inner = (
    <div className="flex h-full flex-col">
      <div className="px-4 pb-4 pt-6 space-y-4">
        {/* Compact header: simpler look without heavy gradient/shadow */}
        <div className="flex items-center gap-3">
          <Link href="/indicators" className="flex items-center gap-3 text-foreground">
            <div className="flex items-center leading-tight">
              <span className="text-sm font-semibold">Fixly</span>
            </div>
          </Link>
          {onRequestClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRequestClose}
              className="ml-auto text-muted-foreground hover:text-foreground"
              aria-label="Ocultar painel lateral"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="mt-3">
          <p className="text-sm font-medium text-foreground">
            {user?.name ?? (loading ? 'Carregando perfil...' : 'Equipe de Manutenção')}
          </p>
          <p className="text-xs text-muted-foreground">
            {loading ? 'Verificando usuário...' : user?.role ? `Perfil ${user.role}` : 'Operador ativo'}
          </p>
        </div>
        <div className="space-y-3">
          <SidebarSeasonCard />
          <SidebarDemandCard />
        </div>
      </div>
      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-5">
          {renderedGroups.map(group => (
            <div key={group.title} className="space-y-2">
              <div className="flex items-center justify-between px-2">
                <p className="text-[0.63rem] uppercase tracking-[0.4em] text-muted-foreground">{group.title}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleGroup(group.title)}
                  aria-expanded={!collapsedGroups?.[group.title]}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {collapsedGroups?.[group.title] ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
              {!collapsedGroups?.[group.title] && (
                <div className="space-y-1">
                  {group.links.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        'flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm font-semibold transition',
                        isActive(link.href)
                          ? 'border-border/20 bg-card/10 text-foreground'
                          : 'border-transparent text-muted-foreground hover:border-border/20 hover:bg-card/5 hover:text-foreground'
                      )}
                    >
                      <link.icon className="h-5 w-5" />
                      <span>{link.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="border-t border-border/10 px-4 py-4">
        <div className="space-y-1">
          {bottomLinks.map(link => canAccess(link.moduleId) && (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm font-semibold transition',
                isActive(link.href)
                  ? 'border-border/30 bg-card/10 text-foreground shadow-[0_8px_30px_rgba(2,6,23,0.35)]'
                  : 'border-transparent text-muted-foreground hover:border-border/20 hover:bg-card/5 hover:text-foreground'
              )}
            >
              <link.icon className="h-4 w-4" />
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );

  const backdropRef = useRef<HTMLDivElement | null>(null);
  const asideRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (backdropRef.current) {
      backdropRef.current.setAttribute('aria-hidden', visible ? 'false' : 'true');
    }
    if (asideRef.current) {
      asideRef.current.setAttribute('aria-hidden', visible ? 'false' : 'true');
    }
  }, [visible]);

  if (pathname && pathname.startsWith('/login')) {
    return null;
  }

  return (
    <>
      {/* Backdrop for mobile overlay */}
      <div
        ref={backdropRef}
        className={cn('fixed inset-0 bg-black/40 z-40 lg:hidden', visible ? 'block' : 'hidden')}
        onClick={() => onRequestClose && onRequestClose()}
      />
      <aside ref={asideRef} className={sidebarClasses}>
        {inner}
      </aside>
    </>
  );
}

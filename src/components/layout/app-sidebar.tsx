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
  LayoutDashboard,
  Flag,
  ActivitySquare,
  Shield,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
// logo removed per UI request
import { useCurrentUser } from '@/hooks/use-current-user';
import { cloneDefaultPermissions } from '@/lib/permissions-config';
import { useAdminSession } from '@/hooks/use-admin-session';
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

const adminLinks = [
  { href: '/admin-panel', icon: LayoutDashboard, label: 'Dashboard Admin', moduleId: 'admin-dashboard' },
  { href: '/admin-panel/users', icon: Users, label: 'Usuários e Papéis', moduleId: 'admin-users' },
  { href: '/admin-panel/modules', icon: Flag, label: 'Módulos e Flags', moduleId: 'admin-modules' },
  { href: '/admin-panel/analytics', icon: LineChart, label: 'Analytics', moduleId: 'admin-analytics' },
  { href: '/admin-panel/audit', icon: Shield, label: 'Auditoria', moduleId: 'admin-audit' },
  { href: '/admin-panel/config', icon: Settings, label: 'Configuração', moduleId: 'admin-config' },
  { href: '/admin-panel/health', icon: ActivitySquare, label: 'Healthcheck', moduleId: 'admin-health' },
];

const bottomLinks = [
  { href: '/settings', icon: Settings, label: 'Configurações', moduleId: 'settings' },
];

interface AppSidebarProps {
  visible: boolean;
  onRequestClose?: () => void;
}

export default function AppSidebar({ visible, onRequestClose }: AppSidebarProps) {
  const pathname = usePathname();
  const { user, loading } = useCurrentUser();
  const { data: session } = useAdminSession();
  const perms = session?.permissions
    ? (() => {
        const merged: Record<string, Record<string, boolean>> = cloneDefaultPermissions();
        const role = user?.role ?? 'visualizador';
        merged[role] = { ...merged[role], ...session.permissions };
        return merged;
      })()
    : null;
  const activeModules = session?.activeModules ?? {};

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem('sidebarCollapsedGroups');
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  });

  const toggleGroup = (title: string) => {
    setCollapsedGroups(prev => {
      const next = { ...(prev || {}), [title]: !prev?.[title] };
      try { localStorage.setItem('sidebarCollapsedGroups', JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };

  const isActive = (href: string) => {
    if (href === '/indicators') {
      return pathname === '/indicators' || pathname === '/';
    }
    return pathname?.startsWith(href);
  };

  const canAccess = (moduleId?: string) => {
    if (!moduleId) return true;
    const role = user?.role ?? 'visualizador';
    if (moduleId === 'administration' && role === 'admin') return true;
    if (activeModules[moduleId] === false) return false;
    if (session?.permissions && typeof session.permissions[moduleId] !== 'undefined') {
      return Boolean(session.permissions[moduleId]);
    }
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
  const adminGroup = {
    title: 'Administração',
    links: adminLinks.filter(link => canAccess(link.moduleId)),
  };
  const renderedGroups = [...visibleGroups, ...(adminGroup.links.length ? [adminGroup] : [])].filter(group => group.links.length > 0);
  const totalVisibleLinks = renderedGroups.reduce((total, group) => total + group.links.length, 0);

  const sidebarClasses = cn(
    'text-foreground border-r border-border/30 transition-transform duration-300 bg-background/90 shadow-sm backdrop-blur-lg',
    'fixed inset-y-0 left-0 z-50 w-72 lg:w-72 lg:z-50',
    visible ? 'translate-x-0' : '-translate-x-full'
  );

  const navLinkClasses = (active: boolean) =>
    cn(
      'flex items-center gap-3 rounded-xl border px-3 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-1',
      active
        ? 'border-border/60 bg-background text-foreground focus-visible:ring-border/60'
        : 'border-transparent text-muted-foreground hover:border-border/40 hover:text-foreground focus-visible:ring-border/30 focus-visible:ring-offset-background'
    );

  const inner = (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-3 px-6 py-5">
        <div className="flex items-center gap-3">
          <Link href="/indicators" className="flex items-center gap-3 text-foreground">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/40 bg-background text-sm font-semibold">
              F
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.3em] text-muted-foreground uppercase">Fixly</p>
              <p className="text-xs text-muted-foreground/70">Painel corporativo</p>
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
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-foreground">
            {user?.name ?? (loading ? 'Carregando perfil...' : 'Equipe de Manutenção')}
          </p>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {loading ? 'Verificando usuário...' : user?.role ? `Perfil ${user.role}` : 'Operador ativo'}
          </p>
        </div>
        <div className="space-y-3">
          <SidebarSeasonCard />
          <SidebarDemandCard />
        </div>
      </div>
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-3">
          {renderedGroups.map(group => (
            <section
              key={group.title}
              className="rounded-2xl border border-border/30 bg-background/70 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-[0.65rem] uppercase tracking-[0.4em] text-muted-foreground">{group.title}</p>
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
                <div className="mt-3 grid gap-2">
                  {group.links.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={navLinkClasses(isActive(link.href))}
                    >
                      <link.icon className="h-5 w-5" />
                      <span>{link.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </ScrollArea>
      <div className="border-t border-border/10 px-5 py-4">
        <div className="space-y-2">
          {bottomLinks.map(link => canAccess(link.moduleId) && (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                navLinkClasses(isActive(link.href)),
                'border-0 px-0 py-1 text-xs uppercase tracking-[0.35em]'
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

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
  Plug,
  Radar,
  ClipboardList,
  Bot,
  Cloud,
  Wrench,
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
  { href: '/services', icon: Wrench, label: 'Gestão de Serviços' },
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

const observabilityLinks = [
  { href: '/data-quality', icon: Radar, label: 'Qualidade dos Dados', moduleId: 'dataQuality' },
  { href: '/action-board', icon: ClipboardList, label: 'Quadro de Ações', moduleId: 'actionBoard' },
  { href: '/ai-chat', icon: Bot, label: 'Chat IA', moduleId: 'aiChat' },
  { href: '/ai-insights', icon: Bot, label: 'Insights AI', moduleId: 'aiInsights' },
  { href: '/integrations', icon: Cloud, label: 'Integrações', moduleId: 'integrations' },
];

const secondaryLinks = [
  { href: '/price-simulator', icon: Calculator, label: 'Simulador de Preços' },
  { href: '/vacations', icon: CalendarDays, label: 'Gestão de Férias', moduleId: 'vacations' },
  { href: '/activity-feed', icon: Activity, label: 'Atividade' },
  { href: '/components-demo', icon: Grid3x3, label: 'Demonstração de Componentes' },
];

const linkGroups = [
  { title: 'Principais', links: mainLinks },
  { title: 'Execução', links: executionLinks },
  { title: 'Mapeamento', links: mappingLinks },
  { title: 'Ativos', links: assetsLinks },
  { title: 'Preventivas', links: preventiveLinks },
  { title: 'Recursos', links: resourcesLinks },
  { title: 'Observatórios', links: observabilityLinks },
  { title: 'Utilitários', links: secondaryLinks },
];

const adminLinks = [
  { href: '/admin-panel', icon: LayoutDashboard, label: 'Dashboard Admin', moduleId: 'admin-dashboard' },
  { href: '/admin-panel/users', icon: Users, label: 'Usuários e Papéis', moduleId: 'admin-users' },
  { href: '/admin-panel/modules', icon: Flag, label: 'Módulos e Flags', moduleId: 'admin-modules' },
  { href: '/admin-panel/integrations', icon: Plug, label: 'Integrações', moduleId: 'admin-integrations' },
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
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export default function AppSidebar({ visible, onRequestClose, onMouseEnter, onMouseLeave }: AppSidebarProps) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  const pathname = usePathname();
  const { user, loading } = useCurrentUser();
  const [hasMounted, setHasMounted] = useState(false);
  const { data: session } = useAdminSession();

  useEffect(() => {
    setHasMounted(true);
  }, []);
  const perms = session?.permissions
    ? (() => {
        const merged: Record<string, Record<string, boolean>> = cloneDefaultPermissions();
        const role = user?.role ?? 'visualizador';
        merged[role] = { ...merged[role], ...session.permissions };
        return merged;
      })()
    : null;
  const activeModules = session?.activeModules ?? {};

  // Initialize collapsed groups to an empty object on both server and initial client render
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // After mount, read persisted collapsed state from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('sidebarCollapsedGroups');
      if (raw) setCollapsedGroups(raw ? JSON.parse(raw) : {});
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
    links: group.links.filter(link => {
      if (!canAccess(link.moduleId)) return false;
      // If session includes modules metadata, respect explicit `visibleInMenu` flag
      if (link.moduleId && session?.modules && typeof session.modules[link.moduleId] !== 'undefined') {
        return Boolean(session.modules[link.moduleId].visibleInMenu);
      }
      return true;
    }),
  }));
  const adminGroup = {
    title: 'Administração',
    links: adminLinks.filter(link => {
      if (!canAccess(link.moduleId)) return false;
      if (link.moduleId && session?.modules && typeof session.modules[link.moduleId] !== 'undefined') {
        return Boolean(session.modules[link.moduleId].visibleInMenu);
      }
      return true;
    }),
  };
  const renderedGroups = [...visibleGroups, ...(adminGroup.links.length ? [adminGroup] : [])].filter(group => group.links.length > 0);

  const sidebarClasses = cn(
    'fixed inset-y-0 left-0 z-50 w-72 md:w-80 bg-slate-950/85 border-r border-white/10 text-foreground shadow-[0_35px_90px_rgba(2,6,23,0.7)] backdrop-blur-3xl transition-transform duration-300',
    // avoid SSR/client class mismatch by applying translate only after hydration
    hydrated ? (visible ? 'translate-x-0' : '-translate-x-full') : '-translate-x-full'
  );

  const navLinkClasses = (active: boolean) =>
    cn(
      'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500/60',
      active
        ? 'bg-gradient-to-r from-indigo-500/70 to-slate-900/60 text-white shadow-[0_12px_35px_rgba(15,23,42,0.45)]'
        : 'text-slate-300 hover:text-white hover:bg-white/10'
    );

  const bottomLinkClasses = (active: boolean) =>
    cn(
      'flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.4em] transition-colors duration-200',
      active ? 'text-white' : 'text-slate-400 hover:text-white'
    );

  const inner = (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-6 py-6 space-y-3">
        <div className="flex items-center gap-4">
          <Link href="/indicators" className="flex items-center gap-3 text-foreground">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-base font-semibold tracking-wider text-white">
              F
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.3em] uppercase text-muted-foreground">Fixly</p>
              <p className="text-xs text-muted-foreground/70">Painel Corporativo</p>
            </div>
          </Link>
          {onRequestClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRequestClose}
              className="ml-auto text-muted-foreground hover:text-white"
              aria-label="Ocultar painel lateral"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold text-foreground">
            {user?.name ?? (loading ? 'Carregando perfil...' : 'Equipe de Manutenção')}
          </p>
          <p className="text-[0.65rem] uppercase tracking-[0.4em] text-slate-400">
            {loading ? 'Verificando usuário...' : user?.role ? `Perfil ${user.role}` : 'Operador ativo'}
          </p>
        </div>
      </div>
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="px-5 py-6 space-y-5">
          {renderedGroups.map(group => (
            <section
              key={group.title}
              className="rounded-3xl border border-white/10 bg-slate-900/60 p-4 shadow-[0_20px_60px_rgba(2,6,23,0.45)]"
            >
              <div className="flex items-center justify-between">
                <p className="text-[0.65rem] uppercase tracking-[0.4em] text-slate-400">{group.title}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleGroup(group.title)}
                  aria-expanded={!collapsedGroups?.[group.title]}
                  className="text-slate-400 hover:text-white"
                >
                  {collapsedGroups?.[group.title] ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
              {!collapsedGroups?.[group.title] && (
                <div className="mt-4 space-y-2">
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
          <div className="h-px w-full bg-white/5" />
          <div className="space-y-3">
            <SidebarSeasonCard />
            <SidebarDemandCard />
          </div>
        </div>
      </ScrollArea>
      <div className="border-t border-white/10 px-6 py-5">
        <div className="space-y-2">
          {bottomLinks.map(link => canAccess(link.moduleId) && (
            <Link
              key={link.href}
              href={link.href}
              className={bottomLinkClasses(isActive(link.href))}
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

  const backdropClass = cn(
    'fixed inset-0 bg-black/40 z-40 lg:hidden',
    hasMounted && visible ? 'block' : 'hidden'
  );

  return (
    <>
      {/* Backdrop for mobile overlay */}
      <div
        ref={backdropRef}
        className={backdropClass}
        onClick={() => onRequestClose && onRequestClose()}
      />
      <aside ref={asideRef} className={sidebarClasses} onMouseEnter={() => onMouseEnter && onMouseEnter()} onMouseLeave={() => onMouseLeave && onMouseLeave()}>
        {inner}
      </aside>
    </>
  );
}


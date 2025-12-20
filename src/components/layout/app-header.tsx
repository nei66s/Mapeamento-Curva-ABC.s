"use client";
import Link from "next/link";
import { useEffect, useState } from 'react';
import {
  PanelLeft,
  Settings,
  ListCollapse,
  ClipboardCheck,
  Map,
  ClipboardList,
  LineChart,
  Wrench,
  Grid3x3,
  Activity,
  Users,
  ShieldCheck,
  Archive,
  FileWarning,
  Construction,
  Info,
  ClipboardPaste,
  Handshake,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NotificationCenter } from "@/components/layout/notification-center";
import { UserNav } from "@/components/layout/user-nav";
import { ActivityHistoryPanel } from "@/components/layout/activity-history";
import { Separator } from "../ui/separator";
// logo removed per UI request
import { ThemeToggle } from "./theme-toggle";
import { usePathname } from 'next/navigation';

interface AppHeaderProps {
  onToggleSidebar?: () => void;
  sidebarVisible?: boolean;
  sidebarMode?: 'pinned' | 'auto' | 'hidden';
  onSetSidebarMode?: (mode: 'pinned' | 'auto' | 'hidden') => void;
}

export default function AppHeader({ onToggleSidebar, sidebarVisible, sidebarMode, onSetSidebarMode }: AppHeaderProps) {
  const pathname = usePathname();
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => setHasMounted(true), []);
  const isAuthPage = Boolean(pathname && pathname.startsWith('/login'));
  // Minimal header on auth pages: only show theme toggle to allow dark mode switching
  if (isAuthPage) {
    return (
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border/60 bg-background/80 px-4 backdrop-blur-sm sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>
    );
  }

  const toggleIcon = hasMounted ? (sidebarVisible ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />) : <span className="inline-block h-4 w-4" />;
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border/60 bg-background/80 px-4 backdrop-blur-sm transition-colors sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <div className="flex items-center gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="ghost" className="sm:hidden bg-transparent">
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="sm:max-w-xs border border-border/40 bg-background/95 p-6 shadow-lg">
            <nav className="space-y-5 text-sm font-medium">
            <Link
              href="/indicators"
              className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground"
            >
              Fixly
            </Link>
            
            <Separator className="border-border/40" />
            
            <Link
              href="/indicators"
              className="flex items-center gap-3 px-2.5 text-sm text-muted-foreground transition hover:text-foreground"
            >
              <LineChart className="h-4 w-4" />
              Indicadores
            </Link>

            <div>
              <h2 className="mb-2 flex items-center gap-2 px-2.5 text-xs font-semibold uppercase tracking-[0.45em] text-muted-foreground">
                <Wrench className="h-4 w-4" />
                Execução
              </h2>
               <div className="space-y-2">
                <Link
                  href="/incidents"
                  className="flex items-center gap-3 px-2.5 text-sm text-muted-foreground transition hover:text-foreground"
                >
                  <Activity className="h-4 w-4" />
                  Incidentes
                </Link>
                <Link
                  href="/rncs"
                  className="flex items-center gap-3 px-2.5 text-sm text-muted-foreground transition hover:text-foreground"
                >
                  <FileWarning className="h-4 w-4" />
                  Registros de Não Conformidade
                </Link>
                <Link
                  href="/releases"
                  className="flex items-center gap-3 px-2.5 text-sm text-muted-foreground transition hover:text-foreground"
                >
                  <ClipboardPaste className="h-4 w-4" />
                  Lançamentos
                </Link>
               </div>
            </div>

            <div>
              <h2 className="mb-2 flex items-center gap-2 px-2.5 text-xs font-semibold uppercase tracking-[0.45em] text-muted-foreground">
                <Map className="h-4 w-4" />
                Mapeamento
              </h2>
               <div className="space-y-2">
                <Link
                  href="/categories"
                  className="flex items-center gap-3 px-2.5 text-sm text-muted-foreground transition hover:text-foreground"
                >
                  <ListCollapse className="h-4 w-4" />
                  Categorias
                </Link>
                <Link
                  href="/matrix"
                  className="flex items-center gap-3 px-2.5 text-sm text-muted-foreground transition hover:text-foreground"
                >
                  <Grid3x3 className="h-4 w-4" />
                  Matriz de Itens
                </Link>
               </div>
            </div>
            
             <div>
              <h2 className="mb-2 flex items-center gap-2 px-2.5 text-xs font-semibold uppercase tracking-[0.45em] text-muted-foreground">
                <ClipboardList className="h-4 w-4" />
                Preventivas
              </h2>
               <div className="space-y-2">
                 <Link
                  href="/compliance"
                  className="flex items-center gap-3 px-2.5 text-sm text-muted-foreground transition hover:text-foreground"
                >
                  <ClipboardCheck className="h-4 w-4" />
                  Preventivas
                </Link>
               </div>
            </div>
            
            <div>
              <h2 className="mb-2 flex items-center gap-2 px-2.5 text-xs font-semibold uppercase tracking-[0.45em] text-muted-foreground">
                <Archive className="h-4 w-4" />
                Recursos
              </h2>
               <div className="space-y-2">
                 <Link
                  href="/suppliers"
                  className="flex items-center gap-3 px-2.5 text-sm text-muted-foreground transition hover:text-foreground"
                >
                  <Users className="h-4 w-4" />
                  Fornecedores
                </Link>
                 <Link
                  href="/warranty"
                  className="flex items-center gap-3 px-2.5 text-sm text-muted-foreground transition hover:text-foreground"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Garantias
                </Link>
                <Link
                  href="/tools"
                  className="flex items-center gap-3 px-2.5 text-sm text-muted-foreground transition hover:text-foreground"
                >
                  <Construction className="h-4 w-4" />
                  Almoxarifado
                </Link>
                <Link
                  href="/settlement"
                  className="flex items-center gap-3 px-2.5 text-sm text-muted-foreground transition hover:text-foreground"
                >
                  <Handshake className="h-4 w-4" />
                  Quitação
                </Link>
               </div>
            </div>
            
            <Separator className="border-border/40" />
            
            <Link
              href="/admin-panel"
              className="flex items-center gap-3 px-2.5 text-sm text-muted-foreground transition hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
              Administração
            </Link>
             <Link
              href="/about"
              className="flex items-center gap-3 px-2.5 text-sm text-muted-foreground transition hover:text-foreground"
            >
              <Info className="h-4 w-4" />
              Sobre
            </Link>
            </nav>
          </SheetContent>
        </Sheet>
        {onToggleSidebar && (
          <div className="hidden items-center gap-2 sm:inline-flex">
            <Button
              variant={sidebarMode === 'pinned' ? 'default' : 'ghost'}
              size="icon"
              className="rounded-xl border border-border/40 text-muted-foreground hover:text-foreground"
              onClick={() => {
                if (onSetSidebarMode) {
                  onSetSidebarMode(sidebarMode === 'pinned' ? 'auto' : 'pinned');
                } else {
                  onToggleSidebar();
                }
              }}
              aria-label={sidebarMode === 'pinned' ? 'Desfixar painel' : 'Fixar painel'}
            >
              {toggleIcon}
              <span className="sr-only">{sidebarMode === 'pinned' ? 'Desfixar painel' : 'Fixar painel'}</span>
            </Button>
          </div>
        )}
      </div>
      <div className="hidden md:flex text-xs uppercase tracking-[0.4em] text-muted-foreground">
        Fixly
      </div>
      <div className="relative ml-auto flex items-center gap-2">
        <ActivityHistoryPanel />
        <NotificationCenter />
        <ThemeToggle />
        <UserNav />
      </div>
    </header>
  );
}

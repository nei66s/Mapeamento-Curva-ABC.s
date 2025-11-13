"use client";
import Link from "next/link";
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { UserNav } from "@/components/layout/user-nav";
import { Separator } from "../ui/separator";
// logo removed per UI request
import { ThemeToggle } from "./theme-toggle";
import { usePathname } from 'next/navigation';

interface AppHeaderProps {
  onToggleSidebar?: () => void;
  sidebarVisible?: boolean;
}

export default function AppHeader({ onToggleSidebar, sidebarVisible }: AppHeaderProps) {
  const pathname = usePathname();
  // Minimal header on auth pages: only show theme toggle to allow dark mode switching
  if (pathname && pathname.startsWith('/login')) {
    return (
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>
    );
  }
  const toggleIcon = sidebarVisible ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />;
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <div className="flex items-center gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="sm:hidden">
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/indicators"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <span className="sr-only">Fixly</span>
            </Link>
            
            <Separator />
            
            <Link
              href="/indicators"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <LineChart className="h-5 w-5" />
              Indicadores
            </Link>

            <div>
              <h2 className="mb-2 flex items-center gap-2 px-2.5 text-lg font-semibold tracking-tight text-primary">
                <Wrench className="h-5 w-5" />
                Execução
              </h2>
               <div className="grid gap-2">
                <Link
                  href="/incidents"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <Activity className="h-5 w-5" />
                  Incidentes
                </Link>
                <Link
                  href="/rncs"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <FileWarning className="h-5 w-5" />
                  Registros de Não Conformidade
                </Link>
                <Link
                  href="/releases"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <ClipboardPaste className="h-5 w-5" />
                  Lançamentos
                </Link>
               </div>
            </div>

            <div>
              <h2 className="mb-2 flex items-center gap-2 px-2.5 text-lg font-semibold tracking-tight text-primary">
                <Map className="h-5 w-5" />
                Mapeamento
              </h2>
               <div className="grid gap-2">
                <Link
                  href="/categories"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <ListCollapse className="h-5 w-5" />
                  Categorias
                </Link>
                <Link
                  href="/matrix"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <Grid3x3 className="h-5 w-5" />
                  Matriz de Itens
                </Link>
               </div>
            </div>
            
             <div>
              <h2 className="mb-2 flex items-center gap-2 px-2.5 text-lg font-semibold tracking-tight text-primary">
                <ClipboardList className="h-5 w-5" />
                Preventivas
              </h2>
               <div className="grid gap-2">
                 <Link
                  href="/compliance"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <ClipboardCheck className="h-5 w-5" />
                  Preventivas
                </Link>
               </div>
            </div>
            
            <div>
              <h2 className="mb-2 flex items-center gap-2 px-2.5 text-lg font-semibold tracking-tight text-primary">
                <Archive className="h-5 w-5" />
                Recursos
              </h2>
               <div className="grid gap-2">
                 <Link
                  href="/suppliers"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <Users className="h-5 w-5" />
                  Fornecedores
                </Link>
                 <Link
                  href="/warranty"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <ShieldCheck className="h-5 w-5" />
                  Garantias
                </Link>
                <Link
                  href="/tools"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <Construction className="h-5 w-5" />
                  Almoxarifado
                </Link>
                <Link
                  href="/settlement"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <Handshake className="h-5 w-5" />
                  Quitação
                </Link>
               </div>
            </div>
            
            <Separator />
            
            <Link
              href="/admin"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Settings className="h-5 w-5" />
              Administração
            </Link>
             <Link
              href="/about"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Info className="h-5 w-5" />
              Sobre
            </Link>
          </nav>
        </SheetContent>
        </Sheet>
        {onToggleSidebar && (
          <Button
            variant="outline"
            size="icon"
            className="hidden rounded-xl border-primary/40 bg-primary/5 text-primary hover:border-primary hover:bg-primary/10 sm:inline-flex"
            onClick={onToggleSidebar}
          >
            {toggleIcon}
            <span className="sr-only">Alternar painel lateral</span>
          </Button>
        )}
      </div>
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
              <BreadcrumbItem>
              <BreadcrumbLink asChild>
              <Link href="/indicators">Fixly</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="relative ml-auto flex items-center gap-2">
        <ThemeToggle />
        <UserNav />
      </div>
    </header>
  );
}

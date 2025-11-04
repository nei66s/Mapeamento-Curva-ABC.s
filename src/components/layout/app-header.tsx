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
import { LogoImage } from "../icons/logo-image";
import { ThemeToggle } from "./theme-toggle";

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
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
              href="/dashboard"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <LogoImage className="h-8 w-8" />
              <span className="sr-only">Manutenção Pague Menos</span>
            </Link>
            
            <Separator />
            
            <Link
              href="/dashboard/indicators"
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
                  href="/dashboard/incidents"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <Activity className="h-5 w-5" />
                  Incidentes
                </Link>
                <Link
                  href="/dashboard/rncs"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <FileWarning className="h-5 w-5" />
                  Registros de Não Conformidade
                </Link>
                <Link
                  href="/dashboard/releases"
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
                  href="/dashboard/categories"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <ListCollapse className="h-5 w-5" />
                  Categorias
                </Link>
                <Link
                  href="/dashboard/matrix"
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
                  href="/dashboard/compliance"
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
                  href="/dashboard/suppliers"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <Users className="h-5 w-5" />
                  Fornecedores
                </Link>
                 <Link
                  href="/dashboard/warranty"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <ShieldCheck className="h-5 w-5" />
                  Garantias
                </Link>
                <Link
                  href="/dashboard/tools"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <Construction className="h-5 w-5" />
                  Almoxarifado
                </Link>
                <Link
                  href="/dashboard/settlement"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <Handshake className="h-5 w-5" />
                  Quitação
                </Link>
               </div>
            </div>
            
            <Separator />
            
            <Link
              href="/dashboard/admin"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Settings className="h-5 w-5" />
              Administração
            </Link>
             <Link
              href="/dashboard/about"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Info className="h-5 w-5" />
              Sobre
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Dashboard</Link>
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

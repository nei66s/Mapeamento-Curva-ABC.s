import Link from "next/link";
import {
  Grid3x3,
  Settings,
  ListCollapse,
  ClipboardCheck,
  Map,
  ClipboardList,
  LineChart,
  Wrench,
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
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LogoImage } from "../icons/logo-image";

const topLevelLinks = [
    { href: "/dashboard/indicators", icon: LineChart, label: "Indicadores" },
];

const navSections = [
    {
        title: "Execução",
        icon: Wrench,
        links: [
            { href: "/dashboard/incidents", icon: Activity, label: "Incidentes" },
            { href: "/dashboard/rncs", icon: FileWarning, label: "Registros de Não Conformidade" },
            { href: "/dashboard/releases", icon: ClipboardPaste, label: "Lançamentos" },
        ]
    },
    {
        title: "Mapeamento",
        icon: Map,
        links: [
            { href: "/dashboard/categories", icon: ListCollapse, label: "Categorias" },
            { href: "/dashboard/matrix", icon: Grid3x3, label: "Matriz de Itens" },
        ]
    },
    {
        title: "Preventivas",
        icon: ClipboardList,
        links: [
            { href: "/dashboard/compliance", icon: ClipboardCheck, label: "Preventivas" },
        ]
    },
    {
        title: "Recursos",
        icon: Archive,
        links: [
            { href: "/dashboard/suppliers", icon: Users, label: "Fornecedores" },
            { href: "/dashboard/warranty", icon: ShieldCheck, label: "Garantias" },
            { href: "/dashboard/tools", icon: Construction, label: "Almoxarifado" },
            { href: "/dashboard/settlement", icon: Handshake, label: "Quitação" },
        ]
    }
];

export default function AppSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-card sm:flex">
      <div className="flex flex-col gap-4 px-4 sm:py-5">
        <Link
          href="/dashboard"
          className="group flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-lg font-semibold text-primary md:text-base"
        >
          <LogoImage className="h-8 w-8 transition-all group-hover:scale-110" />
          <span className="font-bold text-xl font-headline">Manutenção Pague Menos</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto">
        <nav className="flex flex-col gap-2 px-4">
            {topLevelLinks.map((link) => (
            <Link
                key={link.href}
                href={link.href}
                className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted font-medium"
                )}
            >
                <link.icon className="h-5 w-5" />
                {link.label}
            </Link>
            ))}
        </nav>
        
        <Accordion type="multiple" defaultValue={["Execução", "Mapeamento", "Preventivas", "Recursos"]} className="w-full px-4 mt-2">
           {navSections.map(section => (
                <AccordionItem value={section.title} key={section.title} className="border-b-0">
                    <AccordionTrigger className="py-2 hover:no-underline text-primary/80 hover:text-primary">
                         <h2 className="text-base font-semibold tracking-tight flex items-center gap-2">
                            <section.icon className="h-5 w-5" />
                            {section.title}
                        </h2>
                    </AccordionTrigger>
                    <AccordionContent className="pb-1">
                        <nav className="flex flex-col gap-1 pl-2 border-l-2 border-primary/20">
                            {section.links.map((link) => (
                                <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                                )}
                                >
                                <link.icon className="h-5 w-5" />
                                {link.label}
                                </Link>
                            ))}
                        </nav>
                    </AccordionContent>
                </AccordionItem>
           ))}
        </Accordion>
      </div>
      
      <nav className="mt-auto flex flex-col items-center gap-2 px-4 sm:py-5">
         <Link
            href="/dashboard/admin"
            className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
            )}
            >
            <Settings className="h-5 w-5" />
            Administração
        </Link>
         <Link
            href="/dashboard/about"
            className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
            )}
            >
            <Info className="h-5 w-5" />
            Sobre
        </Link>
      </nav>
    </aside>
  );
}

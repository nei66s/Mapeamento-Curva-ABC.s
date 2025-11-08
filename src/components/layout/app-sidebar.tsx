'use client';
import React from 'react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { LogoImage } from '../icons/logo-image';
import { usePathname } from 'next/navigation';

const mainLinks = [
  { href: '/dashboard/indicators', icon: LineChart, label: 'Indicadores', section: 'main' },
];

const executionLinks = [
    { href: "/dashboard/incidents", icon: Activity, label: "Incidentes" },
    { href: "/dashboard/rncs", icon: FileWarning, label: "Registros de Não Conformidade" },
    { href: "/dashboard/releases", icon: ClipboardPaste, label: "Lançamentos" },
    { href: "/dashboard/technical-evaluation", icon: FileScan, label: "Gerar Laudo Técnico" },
];

const mappingLinks = [
    { href: "/dashboard/categories", icon: ListCollapse, label: "Categorias" },
    { href: "/dashboard/matrix", icon: Grid3x3, label: "Matriz de Itens" },
];

const preventiveLinks = [
     { href: "/dashboard/compliance", icon: ClipboardCheck, label: "Preventivas" },
];

const resourcesLinks = [
    { href: "/dashboard/suppliers", icon: Users, label: "Fornecedores" },
    { href: "/dashboard/warranty", icon: ShieldCheck, label: "Garantias" },
    { href: "/dashboard/tools", icon: Construction, label: "Almoxarifado" },
    { href: "/dashboard/settlement", icon: Handshake, label: "Quitação" },
    { href: "/dashboard/unsalvageable", icon: ArchiveX, label: "Itens Inservíveis" },
];

const secondaryLinks = [
    { href: '/dashboard/vacations', icon: CalendarDays, label: 'Gestão de Férias' },
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
  { href: '/dashboard/profile', icon: UserIcon, label: 'Meu Perfil' },
  { href: '/dashboard/settings', icon: Settings, label: 'Configurações' },
  { href: '/dashboard/admin', icon: Info, label: 'Administração' },
];

export default function AppSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard/indicators') {
      return pathname === '/dashboard/indicators' || pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };


  return (
    <TooltipProvider delayDuration={0}>
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-16 flex-col border-r bg-card sm:flex">
        <nav className="flex flex-col items-center gap-2 px-2 sm:py-4">
          <Link
            href="/dashboard"
            className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full text-lg font-semibold text-primary-foreground md:h-12 md:w-12 md:text-base mb-2"
          >
            <LogoImage className="h-8 w-8 transition-all group-hover:scale-110" />
            <span className="sr-only">Manutenção Pague Menos</span>
          </Link>

          {allLinksGroups.map((group, groupIndex) => (
            <React.Fragment key={groupIndex}>
                {groupIndex > 0 && <div className="h-[1px] w-full bg-border my-1" />}
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
        </nav>
      </aside>
    </TooltipProvider>
  );
}

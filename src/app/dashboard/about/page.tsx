'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Activity,
  Archive,
  ClipboardCheck,
  Construction,
  FileWarning,
  Grid3x3,
  LineChart,
  ListCollapse,
  ShieldCheck,
  Users,
} from 'lucide-react';

const features = [
  {
    icon: LineChart,
    title: 'Painel de Indicadores',
    description: 'Análise consolidada dos principais KPIs de manutenção (SLA, Backlog, Custos) com visualizações gráficas e análises preditivas via IA.',
    href: '/dashboard/indicators',
  },
  {
    icon: Activity,
    title: 'Registro de Incidentes',
    description: 'Acompanhe e gerencie eventos e falhas em tempo real. Inclui mapa geográfico de incidentes e análise de causa raiz com IA.',
    href: '/dashboard/incidents',
  },
  {
    icon: FileWarning,
    title: 'Registros de Não Conformidade',
    description: 'Documente e gerencie desvios, atrasos ou problemas de qualidade com fornecedores, vinculando-os a incidentes específicos.',
    href: '/dashboard/rncs',
  },
  {
    icon: ListCollapse,
    title: 'Categorias de Itens',
    description: 'Organize todos os ativos e equipamentos em categorias macro para facilitar a gestão e a aplicação de lógicas de criticidade.',
    href: '/dashboard/categories',
  },
  {
    icon: Grid3x3,
    title: 'Matriz de Itens (ABC)',
    description: 'Gerencie o ciclo de vida de cada item, sua classificação de criticidade (Curva ABC) baseada em fatores de impacto, e planos de contingência.',
    href: '/dashboard/matrix',
  },
  {
    icon: ClipboardCheck,
    title: 'Cronograma de Preventivas',
    description: 'Acompanhe e gerencie a execução de checklists de manutenção preventiva por loja, com mapa interativo e resumo de conformidade.',
    href: '/dashboard/compliance',
  },
  {
    icon: Users,
    title: 'Gestão de Fornecedores',
    description: 'Centralize o cadastro de todos os fornecedores e prestadores de serviço, com informações de contato, especialidade e CNPJ.',
    href: '/dashboard/suppliers',
  },
  {
    icon: ShieldCheck,
    title: 'Controle de Garantias',
    description: 'Monitore o período de garantia de equipamentos, com alertas visuais para itens com garantia próxima do vencimento.',
    href: '/dashboard/warranty',
  },
  {
    icon: Construction,
    title: 'Almoxarifado de Ferramentas',
    description: 'Inventário de ferramentas com controle de alocação por técnico e alertas para revisão semestral pendente.',
    href: '/dashboard/tools',
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Sobre a Plataforma"
        description="Uma visão geral dos recursos e capacidades do sistema de Manutenção Pague Menos."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <Card key={index} className="flex flex-col transition-all hover:scale-[1.02] hover:shadow-primary/20">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3 text-primary">
                <feature.icon className="h-6 w-6" />
              </div>
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

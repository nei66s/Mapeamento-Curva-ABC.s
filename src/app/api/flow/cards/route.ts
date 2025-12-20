import { NextResponse, type NextRequest } from 'next/server';
import { getIncidents } from '@/lib/incidents.server';
import { listRncs } from '@/lib/rncs.server';
import { listScheduledVisits, normalizeStatus } from '@/lib/compliance.server';
import { listItems } from '@/lib/items.server';
import { listSuppliers } from '@/lib/suppliers.server';
import type { FlowCardsResponse, FlowModuleCard } from '@/lib/flow-cards';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const daysParam = Number(url.searchParams.get('sinceDays') ?? '');
  const sinceDays = Number.isFinite(daysParam) && daysParam > 0 ? Math.min(daysParam, 365) : undefined;
  const sinceCutoff = sinceDays ? Date.now() - sinceDays * 86400000 : undefined;

  const [
    incidentsRes,
    rncsRes,
    visitsRes,
    itemsRes,
    suppliersRes,
  ] = await Promise.allSettled([
    getIncidents(),
    listRncs(),
    listScheduledVisits(),
    listItems(),
    listSuppliers(),
  ]);

  const incidents = incidentsRes.status === 'fulfilled' ? incidentsRes.value : [];
  const rncs = rncsRes.status === 'fulfilled' ? rncsRes.value : [];
  const visits = visitsRes.status === 'fulfilled' ? visitsRes.value : [];
  const items = itemsRes.status === 'fulfilled' ? itemsRes.value : [];
  const suppliers = suppliersRes.status === 'fulfilled' ? suppliersRes.value : [];

  const filteredVisits = sinceCutoff
    ? visits.filter((visit) => {
        if (!visit.visitDate) return false;
        const visitTime = Date.parse(visit.visitDate);
        return Number.isFinite(visitTime) && visitTime >= sinceCutoff;
      })
    : visits;

  const openIncidents = incidents.filter((item) => item.status === 'Aberto' || item.status === 'Em Andamento').length;
  const resolvedIncidents = incidents.filter((item) => item.status === 'Resolvido' || item.status === 'Fechado').length;

  const openRncs = rncs.filter((rnc) => rnc.status === 'Aberta' || rnc.status === 'Em AnÁlise').length;
  const closedRncs = rncs.length - openRncs;

  const pendingVisits = filteredVisits.filter((visit) =>
    visit.items.some((item) => normalizeStatus(item.status) === 'pending')
  ).length;
  const completedVisits = filteredVisits.filter((visit) =>
    visit.items.every((item) => {
      const status = normalizeStatus(item.status);
      return status === 'completed' || status === 'not-applicable';
    })
  ).length;
  const pendingItems = filteredVisits.reduce(
    (sum, visit) => sum + visit.items.filter((item) => normalizeStatus(item.status) === 'pending').length,
    0
  );

  const offlineItems = items.filter((item) => item.status === 'offline').length;
  const maintenanceItems = items.filter((item) => item.status === 'maintenance').length;
  const onlineItems = items.filter((item) => item.status === 'online').length;

  const supplierCount = suppliers.length;
  const suppliersWithContact = suppliers.filter((supplier) => Boolean(supplier.contactEmail || supplier.contactName)).length;

  const cards: FlowModuleCard[] = [
    {
      id: 'indicators',
      label: 'Indicators',
      description: 'Needs Improvement (range 50-90)',
      link: '/indicators',
      accent: 'from-rose-50 via-white to-white',
      primaryLabel: 'Metric A',
      primaryValue: 38,
      secondaryLabel: 'Metric B',
      secondaryValue: 70,
    },
    {
      id: 'escopos',
      label: 'Escopos',
      description: 'Needs Improvement (range 50-90)',
      link: '/escopos',
      accent: 'from-yellow-50 via-white to-white',
      primaryLabel: 'Metric A',
      primaryValue: 16,
      secondaryLabel: 'Metric B',
      secondaryValue: 75,
    },
    {
      id: 'admin-health',
      label: 'Admin Health',
      description: 'Needs Improvement (range 50-90)',
      link: '/admin-panel/health',
      accent: 'from-sky-50 via-white to-white',
      primaryLabel: 'Metric A',
      primaryValue: 16,
      secondaryLabel: 'Metric B',
      secondaryValue: 52,
    },
    {
      id: 'incidents',
      label: 'Registro de Incidentes',
      description: 'Chamados abertos e em andamento aguardando atendimento.',
      link: '/incidents',
      accent: 'from-rose-50 via-white to-white',
      primaryLabel: 'Aberto / Em andamento',
      primaryValue: openIncidents,
      secondaryLabel: 'Resolvidos / Fechados',
      secondaryValue: resolvedIncidents,
      detail:
        incidents.length > 0
          ? `Último detectado: ${incidents[0].itemName || incidents[0].location || 'sem descrição'}`
          : 'Nenhum incidente registrado ainda.',
    },
    {
      id: 'rncs',
      label: 'Registros de Não Conformidade',
      description: 'Casos que ainda estão sendo investigados.',
      link: '/rncs',
      accent: 'from-orange-50 via-white to-white',
      primaryLabel: 'Aberta / Em análise',
      primaryValue: openRncs,
      secondaryLabel: 'Concluídas / Canceladas',
      secondaryValue: closedRncs,
      detail: rncs.length > 0 ? `Último status: ${rncs[0].status}` : 'Nenhuma RNC no momento.',
    },
    {
      id: 'compliance',
      label: 'Preventivas',
      description: 'Visitas programadas com itens mantidos ou pendentes.',
      link: '/compliance',
      accent: 'from-sky-50 via-white to-white',
      primaryLabel: 'Itens pendentes',
      primaryValue: pendingItems,
      secondaryLabel: 'Visitas pendentes',
      secondaryValue: pendingVisits,
      detail:
        filteredVisits.length > 0
          ? `${completedVisits} visitas concluídas de ${filteredVisits.length} programadas`
          : 'Nenhuma visita agendada recentemente.',
    },
    {
      id: 'matrix',
      label: 'Matriz de Itens',
      description: 'Inventário de ativos com status de operação.',
      link: '/matrix',
      accent: 'from-emerald-50 via-white to-white',
      primaryLabel: 'Itens offline',
      primaryValue: offlineItems,
      secondaryLabel: 'Em manutenção',
      secondaryValue: maintenanceItems,
      detail: `Em operação: ${onlineItems}`,
    },
    {
      id: 'suppliers',
      label: 'Fornecedores',
      description: 'Parceiros cadastrados e prontos para atendimento.',
      link: '/suppliers',
      accent: 'from-indigo-50 via-white to-white',
      primaryLabel: 'Fornecedores ativos',
      primaryValue: supplierCount,
      secondaryLabel: 'Com contato',
      secondaryValue: suppliersWithContact,
      detail: supplierCount > 0 ? `Último cadastrado: ${suppliers.at(-1)?.name ?? 'sem nome'}` : 'Nenhum fornecedor cadastrado.',
    },
  ];

  const totalActivities = cards.reduce((sum, card) => sum + card.primaryValue, 0);

  const response: FlowCardsResponse = {
    cards,
    totalActivities,
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json(response);
}

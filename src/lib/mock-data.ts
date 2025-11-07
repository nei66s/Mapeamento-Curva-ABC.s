import type {
    Item,
    Incident,
    Category,
    ComplianceChecklistItem,
    StoreComplianceData,
    MaintenanceIndicator,
    Store,
    Supplier,
    WarrantyItem,
    RNC,
    Tool,
    SettlementLetter,
} from '@/lib/types';
import type { TechnicalReport, Technician } from '@/lib/types';

// Mock data eliminated. These stubs keep the app compiling while we migrate pages to fetch from PostgreSQL.
export const mockItems: Item[] = [];
export const mockCategories: Category[] = [];
export const allStores: Store[] = [];
// export const mockIncidents: Incident[] = []; // replaced with sample incidents below
export const mockMaintenanceIndicators: MaintenanceIndicator[] = [
    {
        id: 'MI-2025-10',
        mes: '2025-10',
        sla_mensal: 92,
        meta_sla: 95,
        crescimento_mensal_sla: -1.5,
        r2_tendencia: 0.85,
        chamados_abertos: 120,
        chamados_solucionados: 110,
        backlog: 25,
        valor_mensal: 12000,
        valor_orcado: 15000,
        aging: {
            inferior_30: { baixa: 10, media: 8, alta: 2, muito_alta: 0 },
            entre_30_60: { baixa: 6, media: 4, alta: 3, muito_alta: 1 },
            entre_60_90: { baixa: 3, media: 2, alta: 1, muito_alta: 0 },
            superior_90: { baixa: 1, media: 1, alta: 0, muito_alta: 0 },
        },
        criticidade: { baixa: 20, media: 15, alta: 6, muito_alta: 1 },
        prioridade: { baixa: 18, media: 12, alta: 10, muito_alta: 2 },
    },
    {
        id: 'MI-2025-11',
        mes: '2025-11',
        sla_mensal: 94,
        meta_sla: 95,
        crescimento_mensal_sla: 2.2,
        r2_tendencia: 0.88,
        chamados_abertos: 105,
        chamados_solucionados: 102,
        backlog: 20,
        valor_mensal: 10000,
        valor_orcado: 14000,
        aging: {
            inferior_30: { baixa: 12, media: 9, alta: 1, muito_alta: 0 },
            entre_30_60: { baixa: 5, media: 3, alta: 2, muito_alta: 0 },
            entre_60_90: { baixa: 2, media: 1, alta: 0, muito_alta: 0 },
            superior_90: { baixa: 0, media: 1, alta: 0, muito_alta: 0 },
        },
        criticidade: { baixa: 19, media: 13, alta: 3, muito_alta: 0 },
        prioridade: { baixa: 16, media: 15, alta: 5, muito_alta: 0 },
    }
];
export const mockSuppliers: Supplier[] = [];
export const mockWarrantyItems: WarrantyItem[] = [];
export const mockRncs: RNC[] = [];
export const mockTools: Tool[] = [];
export const mockSettlementLetters: SettlementLetter[] = [];
export const mockComplianceChecklistItems: ComplianceChecklistItem[] = [];
export const mockStoreComplianceData: StoreComplianceData[] = [];

// Minimal mock for technical reports (keeps UI working while DB migration completes)
export const mockTechnicalReports: TechnicalReport[] = [
    {
        id: 'LTD-1',
        title: 'Laudo Exemplo - Troca de Peça',
        incidentId: undefined,
        technicianId: 'tech-1',
        details: {
            itemDescription: 'Ar Condicionado Split 12.000 BTUs',
            itemPatrimony: 'PM-123456',
            itemQuantity: 1,
            itemLocation: 'Loja 10 - Campinas',
            itemState: 'partial',
            problemFound: 'Componente X danificado, com funcionamento parcial.',
            itemDiagnosis: 'Falha intermitente no compressor, possivelmente capacitor comprometido.',
            repairViable: 'yes',
            repairCost: '150.00',
            recommendations: 'repair',
            actionsTaken: 'Substituição de capacitor e teste funcional.',
            // techName and techRole removed; use mockTechnicians to lookup
        },
        createdAt: new Date().toISOString(),
        status: 'Pendente',
    },
];

export const mockTechnicians: Technician[] = [
    { id: 'tech-1', name: 'Fulano de Tal', role: 'Técnico de Refrigeração' },
    { id: 'tech-2', name: 'Ciclano de Souza', role: 'Técnico Eletricista' },
];

export const mockIncidents: Incident[] = [
    { id: 'INC-101', itemName: 'Ar Condicionado Split 12.000 BTUs', location: 'Loja 10 - Campinas', status: 'Aberto', openedAt: new Date().toISOString(), description: 'Queda de performance intermitente' },
    { id: 'INC-102', itemName: 'Quadro Elétrico 220V', location: 'Loja 5 - São Paulo', status: 'Em Andamento', openedAt: new Date().toISOString(), description: 'Curto-circuito no circuito auxiliar' },
];
// end of mocks stub

// end of mocks stub


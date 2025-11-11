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
    // Series for the year so charts show more variation in backlog
    {
        id: 'MI-2025-03',
        mes: '2025-03',
        sla_mensal: 90,
        meta_sla: 95,
        crescimento_mensal_sla: -0.5,
        r2_tendencia: 0.75,
        chamados_abertos: 80,
        chamados_solucionados: 70,
    backlog: 5,
        aging: {
            inferior_30: { baixa: 6, media: 5, alta: 2, muito_alta: 0 },
            entre_30_60: { baixa: 2, media: 1, alta: 0, muito_alta: 0 },
            entre_60_90: { baixa: 1, media: 0, alta: 0, muito_alta: 0 },
            superior_90: { baixa: 0, media: 0, alta: 0, muito_alta: 0 },
        },
        criticidade: { baixa: 10, media: 6, alta: 1, muito_alta: 0 },
        prioridade: { baixa: 8, media: 4, alta: 1, muito_alta: 0 },
    },
    {
        id: 'MI-2025-04',
        mes: '2025-04',
        sla_mensal: 88,
        meta_sla: 95,
        crescimento_mensal_sla: -2.0,
        r2_tendencia: 0.72,
        chamados_abertos: 95,
        chamados_solucionados: 80,
    backlog: 12,
        aging: {
            inferior_30: { baixa: 8, media: 6, alta: 2, muito_alta: 0 },
            entre_30_60: { baixa: 3, media: 2, alta: 1, muito_alta: 0 },
            entre_60_90: { baixa: 1, media: 1, alta: 0, muito_alta: 0 },
            superior_90: { baixa: 0, media: 0, alta: 0, muito_alta: 0 },
        },
        criticidade: { baixa: 12, media: 8, alta: 2, muito_alta: 0 },
        prioridade: { baixa: 10, media: 6, alta: 1, muito_alta: 0 },
    },
    {
        id: 'MI-2025-05',
        mes: '2025-05',
        sla_mensal: 85,
        meta_sla: 95,
        crescimento_mensal_sla: -3.5,
        r2_tendencia: 0.70,
        chamados_abertos: 130,
        chamados_solucionados: 110,
    backlog: 30,
        aging: {
            inferior_30: { baixa: 10, media: 9, alta: 5, muito_alta: 1 },
            entre_30_60: { baixa: 6, media: 4, alta: 3, muito_alta: 1 },
            entre_60_90: { baixa: 4, media: 2, alta: 1, muito_alta: 0 },
            superior_90: { baixa: 2, media: 1, alta: 0, muito_alta: 0 },
        },
        criticidade: { baixa: 22, media: 15, alta: 8, muito_alta: 1 },
        prioridade: { baixa: 20, media: 12, alta: 10, muito_alta: 1 },
    },
    {
        id: 'MI-2025-06',
        mes: '2025-06',
        sla_mensal: 87,
        meta_sla: 95,
        crescimento_mensal_sla: 1.5,
        r2_tendencia: 0.78,
        chamados_abertos: 140,
        chamados_solucionados: 125,
    backlog: 45,
        aging: {
            inferior_30: { baixa: 14, media: 10, alta: 6, muito_alta: 2 },
            entre_30_60: { baixa: 8, media: 5, alta: 4, muito_alta: 1 },
            entre_60_90: { baixa: 3, media: 2, alta: 1, muito_alta: 0 },
            superior_90: { baixa: 2, media: 1, alta: 0, muito_alta: 0 },
        },
        criticidade: { baixa: 28, media: 18, alta: 10, muito_alta: 2 },
        prioridade: { baixa: 22, media: 16, alta: 12, muito_alta: 2 },
    },
    {
        id: 'MI-2025-07',
        mes: '2025-07',
        sla_mensal: 91,
        meta_sla: 95,
        crescimento_mensal_sla: 4.0,
        r2_tendencia: 0.80,
        chamados_abertos: 110,
        chamados_solucionados: 105,
    backlog: 20,
        aging: {
            inferior_30: { baixa: 12, media: 8, alta: 4, muito_alta: 1 },
            entre_30_60: { baixa: 5, media: 3, alta: 2, muito_alta: 0 },
            entre_60_90: { baixa: 2, media: 1, alta: 0, muito_alta: 0 },
            superior_90: { baixa: 1, media: 1, alta: 0, muito_alta: 0 },
        },
        criticidade: { baixa: 18, media: 12, alta: 6, muito_alta: 1 },
        prioridade: { baixa: 15, media: 10, alta: 6, muito_alta: 1 },
    },
    {
        id: 'MI-2025-08',
        mes: '2025-08',
        sla_mensal: 89,
        meta_sla: 95,
        crescimento_mensal_sla: -1.0,
        r2_tendencia: 0.77,
        chamados_abertos: 150,
        chamados_solucionados: 140,
    backlog: 60,
        aging: {
            inferior_30: { baixa: 18, media: 12, alta: 8, muito_alta: 2 },
            entre_30_60: { baixa: 10, media: 6, alta: 4, muito_alta: 1 },
            entre_60_90: { baixa: 6, media: 3, alta: 2, muito_alta: 1 },
            superior_90: { baixa: 3, media: 2, alta: 1, muito_alta: 1 },
        },
        criticidade: { baixa: 35, media: 22, alta: 15, muito_alta: 4 },
        prioridade: { baixa: 30, media: 20, alta: 12, muito_alta: 3 },
    },
    {
        id: 'MI-2025-09',
        mes: '2025-09',
        sla_mensal: 93,
        meta_sla: 95,
        crescimento_mensal_sla: 4.5,
        r2_tendencia: 0.83,
        chamados_abertos: 100,
        chamados_solucionados: 98,
    backlog: 15,
        aging: {
            inferior_30: { baixa: 10, media: 8, alta: 2, muito_alta: 0 },
            entre_30_60: { baixa: 4, media: 3, alta: 1, muito_alta: 0 },
            entre_60_90: { baixa: 2, media: 1, alta: 0, muito_alta: 0 },
            superior_90: { baixa: 1, media: 0, alta: 0, muito_alta: 0 },
        },
        criticidade: { baixa: 16, media: 11, alta: 4, muito_alta: 0 },
        prioridade: { baixa: 14, media: 9, alta: 5, muito_alta: 0 },
    },
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
    // Maio / Junho samples
    { id: 'INC-050', itemName: 'Máquina de Lavar Industrial', location: 'Loja 1 - Salvador', status: 'Fechado', openedAt: '2025-05-10T08:30:00.000Z', description: 'Vazamento intermitente' },
    { id: 'INC-061', itemName: 'Compressor', location: 'CD - Barueri', status: 'Em Andamento', openedAt: '2025-06-20T10:15:00.000Z', description: 'Alto ruído e perda de pressão' },
    { id: 'INC-062', itemName: 'Compressor', location: 'CD - Barueri', status: 'Aberto', openedAt: '2025-06-25T09:00:00.000Z', description: 'Falha intermitente após manutenção' },

    // Agosto (picos) - add many varied incidents so Pareto shows multiple bars
    { id: 'INC-080', itemName: 'Painel Elétrico', location: 'Loja 3 - Belo Horizonte', status: 'Aberto', openedAt: '2025-08-03T14:20:00.000Z', description: 'Queda de energia localizada' },
    { id: 'INC-081', itemName: 'Inversor de Frequência', location: 'Loja 4 - Fortaleza', status: 'Fechado', openedAt: '2025-08-04T09:10:00.000Z', description: 'Oscilação na velocidade do motor' },
    { id: 'INC-082', itemName: 'Ar Condicionado Split 18.000 BTUs', location: 'Loja 10 - Campinas', status: 'Em Andamento', openedAt: '2025-08-15T11:10:00.000Z', description: 'Não refrigera adequadamente' },
    { id: 'INC-083', itemName: 'Ar Condicionado Split 12.000 BTUs', location: 'Loja 11 - Santos', status: 'Aberto', openedAt: '2025-08-16T10:05:00.000Z', description: 'Vazamento de gás' },
    { id: 'INC-084', itemName: 'Ar Condicionado Janela', location: 'Loja 12 - João Pessoa', status: 'Fechado', openedAt: '2025-08-17T08:30:00.000Z', description: 'Ruído excessivo' },
    { id: 'INC-085', itemName: 'Compressor', location: 'CD - Barueri', status: 'Aberto', openedAt: '2025-08-18T07:20:00.000Z', description: 'Perda de pressão' },
    { id: 'INC-086', itemName: 'Motor de Elevador', location: 'Loja 2 - Rio de Janeiro', status: 'Aberto', openedAt: '2025-08-19T16:45:00.000Z', description: 'Vibração anormal durante operação' },
    { id: 'INC-087', itemName: 'Válvula Solenoide', location: 'Loja 8 - Recife', status: 'Fechado', openedAt: '2025-08-20T07:45:00.000Z', description: 'Substituição devido a vazamento' },
    { id: 'INC-088', itemName: 'Bomba de Água', location: 'Loja 6 - Curitiba', status: 'Em Andamento', openedAt: '2025-08-21T13:15:00.000Z', description: 'Falha intermitente na sucção' },
    { id: 'INC-089', itemName: 'Sensor de Temperatura', location: 'Loja 7 - Porto Alegre', status: 'Aberto', openedAt: '2025-08-22T09:50:00.000Z', description: 'Leitura inconsistente' },
    { id: 'INC-090', itemName: 'Esteira Transportadora', location: 'CD - Barueri', status: 'Fechado', openedAt: '2025-08-23T12:00:00.000Z', description: 'Desalinhamento' },
    { id: 'INC-091', itemName: 'Máquina de Lavar Industrial', location: 'Loja 1 - Salvador', status: 'Aberto', openedAt: '2025-08-24T08:30:00.000Z', description: 'Vazamento e erro eletrônico' },
    { id: 'INC-092', itemName: 'Sensor de Umidade', location: 'Loja 9 - Manaus', status: 'Aberto', openedAt: '2025-08-25T10:00:00.000Z', description: 'Leitura fora da faixa' },
    { id: 'INC-093', itemName: 'Bomba Hidráulica', location: 'Loja 13 - Belém', status: 'Em Andamento', openedAt: '2025-08-26T14:30:00.000Z', description: 'Perda de pressão intermitente' },
    { id: 'INC-094', itemName: 'Vibrador de Correia', location: 'CD - Barueri', status: 'Fechado', openedAt: '2025-08-27T09:45:00.000Z', description: 'Ruído anormal' },
    { id: 'INC-095', itemName: 'Inversor de Frequência', location: 'Loja 14 - Fortaleza', status: 'Aberto', openedAt: '2025-08-28T11:20:00.000Z', description: 'Falha intermitente no acionamento' },

    // Setembro / Outubro / Novembro samples
    { id: 'INC-100', itemName: 'Válvula Solenoide', location: 'Loja 8 - Recife', status: 'Fechado', openedAt: '2025-09-05T07:45:00.000Z', description: 'Substituição devido a vazamento' },
    { id: 'INC-101', itemName: 'Ar Condicionado Split 12.000 BTUs', location: 'Loja 10 - Campinas', status: 'Aberto', openedAt: '2025-10-10T12:00:00.000Z', description: 'Queda de performance intermitente' },
    { id: 'INC-102', itemName: 'Quadro Elétrico 220V', location: 'Loja 5 - São Paulo', status: 'Em Andamento', openedAt: '2025-11-05T09:30:00.000Z', description: 'Curto-circuito no circuito auxiliar' },
    { id: 'INC-111', itemName: 'Motor de Elevador', location: 'Loja 2 - Rio de Janeiro', status: 'Aberto', openedAt: '2025-11-12T16:45:00.000Z', description: 'Vibração anormal durante operação' },
];
// end of mocks stub

// end of mocks stub


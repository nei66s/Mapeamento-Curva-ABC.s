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
export const mockMaintenanceIndicators: MaintenanceIndicator[] = [];
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


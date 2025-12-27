import type { ImpactFactor } from './impact-factors';

export type Classification = 'A' | 'B' | 'C';
export type IncidentStatus = 'Aberto' | 'Em Andamento' | 'Resolvido' | 'Fechado';
export type UserRole = 'admin' | 'gestor' | 'regional' | 'visualizador' | 'fornecedor' | 'usuario';
export type ComplianceStatus = 'completed' | 'pending' | 'not-applicable';
export type RncStatus = 'Aberta' | 'Em Análise' | 'Concluída' | 'Cancelada';
export type RncClassification = 'Crítica' | 'Moderada' | 'Baixa';
export type ToolStatus = 'Disponível' | 'Em Uso' | 'Em Manutenção';
export type SettlementStatus = 'Pendente' | 'Recebida';


export type Category = {
  id: string;
  name: string;
  description: string;
  classification: Classification;
  imageUrl?: string;
  itemCount: number;
  riskIndex: number;
};

export type Item = {
  id?: string;
  name: string;
  category: string;
  classification: Classification;
  storeCount: number;
  impactFactors: string[];
  status: 'online' | 'offline' | 'maintenance';
  contingencyPlan: string;
  leadTime: string;
  imageUrl?: string;
  // optional category-level average criticality (0-10 scale)
  categoryRiskIndex?: number;
};

export type Incident = {
  id: string;
  title?: string;
  itemName: string;
  storeId?: string;
  location: string;
  status: IncidentStatus;
  openedAt: string; // ISO date string
  description: string;
  lat?: number;
  lng?: number;
};

export type Store = {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
};


export type ComplianceChecklistItem = {
    id: string;
    name: string;
    classification: Classification;
};

export type StoreComplianceData = {
    storeId: string;
    storeName: string;
    visitDate: string; // ISO date string for the scheduled visit
    items: {
        itemId: string;
        status: ComplianceStatus;
    }[];
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  password?: string;
  supplierId?: string; // Associated supplier if role is 'fornecedor'
  department?: string; // optional department name used by some UI fixtures
  profile?: Record<string, any> | null;
};

export type VacationRequest = {
  id: string;
  userId: string;
  userName: string;
  userDepartment?: string;
  status: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  requestedAt?: string; // ISO date
  userAvatarUrl?: string;
  totalDays?: number | null;
};

export type Technician = {
  id: string;
  name: string;
  role?: string;
};
export type AgingCriticidade = {
  baixa: number;
  media: number;
  alta: number;
  muito_alta: number;
};

export type MaintenanceIndicator = {
  id:string;
  mes: string;
  sla_mensal: number;
  meta_sla: number;
  crescimento_mensal_sla: number;
  r2_tendencia: number;
  chamados_abertos: number;
  chamados_solucionados: number;
  backlog: number;
  aging: {
    inferior_30: AgingCriticidade;
    entre_30_60: AgingCriticidade;
    entre_60_90: AgingCriticidade;
    superior_90: AgingCriticidade;
  };
  criticidade: { // This might be redundant now or could represent totals
    baixa: number;
    media: number;
    alta: number;
    muito_alta: number;
  };
  prioridade: {
    baixa: number;
    media: number;
    alta: number;
    muito_alta: number;
  };
};

export type Supplier = {
  id: string;
  name: string;
  contactName: string;
  contactEmail: string;
  cnpj: string;
  specialty: string;
};

export type WarrantyItem = {
  id: string;
  itemName: string;
  storeLocation: string;
  serialNumber?: string;
  purchaseDate: string; // ISO date string
  warrantyEndDate: string; // ISO date string
  supplierId: string;
  notes?: string;
};

export type UnsalvageableStatus = 'Pendente' | 'Aprovado' | 'Descarte' | 'Concluído';

export type UnsalvageableItem = {
  id: string;
  itemName: string;
  quantity: number;
  reason: string;
  requestDate: string; // ISO date string
  requesterId?: string;
  status: UnsalvageableStatus;
  disposalDate?: string; // ISO date string when disposal happened
};

export type RNC = {
    id: string;
    title: string;
    supplierId: string;
    incidentId?: string;
    description: string;
    status: RncStatus;
    classification: RncClassification;
    createdAt: string; // ISO date string
};

export type Tool = {
  id: string;
  name: string;
  category: 'Manual' | 'Elétrica' | 'Medição' | 'EPI';
  serialNumber?: string;
  status: ToolStatus;
  assignedTo?: string; // User ID
  purchaseDate: string; // ISO date string
  lastMaintenance?: string; // ISO date string
};

export type AssetInsumo = {
  name: string;
  description?: string;
  quantity?: number;
  safetyStock?: boolean;
  stockLocation?: string;
};

export type AssetComponente = {
  name: string;
  description?: string;
  maintenanceComplexity?: string;
  costEstimate?: string;
  stockAvailable?: boolean;
  criticality?: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
};

export type AssetRecord = {
  id: string;
  storeId?: string;
  storeName: string;
  name: string;
  patrimony?: string;
  hierarchy?: string;
  description?: string;
  complexity?: string;
  costEstimate?: string;
  riskNotes?: string;
  insumos: AssetInsumo[];
  componentes: AssetComponente[];
  createdAt: string;
  updatedAt: string;
};

export type SettlementLetter = {
  id: string;
  supplierId: string;
  contractId: string;
  description: string;
  requestDate: string; // ISO date string
  receivedDate?: string; // ISO date string
  status: SettlementStatus;
  periodStartDate: string; // ISO date string
  periodEndDate: string; // ISO date string
};

export type ActionBoardItem = {
  id: string;
  title: string;
  owner: string;
  dueDate?: string | null;
  status: string;
  progress: number;
  details?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AiInsight = {
  id: string;
  title: string;
  summary?: string | null;
  action?: string | null;
  status: string;
  source?: string | null;
  createdAt: string;
  updatedAt: string;
};

// Technical report types used by the Laudos (technical reports) feature
export type ReportStatus = 'Pendente' | 'Concluído';

export type TechnicalReport = {
  id: string;
  title: string;
  incidentId?: string;
  technicianId: string;
  details: {
    // fields from the Technical Evaluation form
    itemDescription?: string;
    itemPatrimony?: string;
    itemQuantity?: number;
    itemLocation?: string;
    itemState?: 'damaged' | 'partial' | 'obsolete' | 'unused';
    problemFound: string;
    itemDiagnosis?: string;
    repairViable?: 'yes' | 'no';
  // repairCost removed per request
    recommendations?: 'repair' | 'discard' | 'evaluate' | string;
    actionsTaken?: string;
    // who evaluated
  // technician is referenced by technicianId on the report; name/role are stored on the Technician entity
  };
  createdAt: string; // ISO date
  status: ReportStatus;
};

export const userRoles = ['admin', 'gestor', 'regional', 'visualizador', 'fornecedor', 'usuario'] as const;

export function isValidUserRole(role: any): role is UserRole {
  return userRoles.includes(role);
}

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error';
export type NotificationRecord = {
  id: number;
  userId: string;
  module?: string | null;
  title: string;
  message?: string | null;
  severity: NotificationSeverity;
  relatedId?: string | null;
  meta?: Record<string, any> | null;
  createdAt: string;
  readAt: string | null;
};

export type NotificationPayload = {
  module?: string | null;
  title: string;
  message?: string | null;
  severity?: NotificationSeverity;
  relatedId?: string | null;
  meta?: Record<string, any> | null;
};

export type UserHistoryEntry = {
  id: number;
  userId: string;
  module?: string | null;
  action?: string | null;
  pathname: string;
  details?: Record<string, any> | null;
  createdAt: string;
};

export type HistoryPayload = {
  module?: string | null;
  action?: string | null;
  pathname: string;
  details?: Record<string, any> | null;
};

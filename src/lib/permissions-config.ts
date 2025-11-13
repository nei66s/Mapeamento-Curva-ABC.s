import { UserRole } from './types';

export type ModuleDefinition = {
  id: string;
  label: string;
};

export const roleList: UserRole[] = ['admin', 'gestor', 'regional', 'visualizador', 'fornecedor'];

export const moduleDefinitions: ModuleDefinition[] = [
  { id: 'indicators', label: 'Painel de Indicadores' },
  { id: 'releases', label: 'Lançamentos Mensais' },
  { id: 'incidents', label: 'Registro de Incidentes' },
  { id: 'rncs', label: 'Registros de Não Conformidade' },
  { id: 'laudos', label: 'Gerar Laudo Técnico' },
  { id: 'categories', label: 'Categorias de Itens' },
  { id: 'matrix', label: 'Matriz de Itens' },
  { id: 'compliance', label: 'Cronograma de Preventivas' },
  { id: 'suppliers', label: 'Gestão de Fornecedores' },
  { id: 'warranty', label: 'Controle de Garantias' },
  { id: 'tools', label: 'Almoxarifado de Ferramentas' },
  { id: 'vacations', label: 'Gestão de Férias' },
  { id: 'settlement', label: 'Cartas de Quitação' },
  { id: 'profile', label: 'Meu Perfil' },
  { id: 'settings', label: 'Configurações' },
  { id: 'about', label: 'Sobre a Plataforma' },
];

const adminPermissions = Object.fromEntries(moduleDefinitions.map(m => [m.id, true]));

const defaultRolePermissions: Record<UserRole, Record<string, boolean>> = {
  // keep admin explicit (all modules enabled)
  admin: { ...adminPermissions, vacations: true },
  gestor: {
    indicators: true,
    releases: true,
    incidents: true,
    rncs: true,
    categories: true,
    matrix: true,
    compliance: true,
    suppliers: true,
    warranty: true,
    tools: true,
    settlement: true,
    vacations: true,
    profile: true,
    settings: true,
    about: true,
  },
  regional: {
    indicators: true,
    releases: false,
    incidents: true,
    rncs: true,
    categories: false,
    matrix: true,
    compliance: true,
    suppliers: false,
    warranty: true,
    tools: true,
    settlement: false,
    vacations: false,
    profile: true,
    settings: true,
    about: true,
  },
  visualizador: {
    indicators: true,
    releases: false,
    incidents: false,
    rncs: false,
    categories: false,
    matrix: false,
    compliance: false,
    suppliers: false,
    warranty: false,
    tools: false,
    settlement: false,
    vacations: false,
    profile: true,
    settings: false,
    about: true,
  },
  fornecedor: {
    indicators: false,
    releases: false,
    incidents: false,
    rncs: false,
    categories: false,
    matrix: false,
    compliance: false,
    suppliers: false,
    warranty: false,
    tools: false,
    settlement: true,
    vacations: false,
    profile: true,
    settings: true,
    about: true,
  },
};

export function cloneDefaultPermissions(): Record<UserRole, Record<string, boolean>> {
  const copy: Record<UserRole, Record<string, boolean>> = {} as any;
  roleList.forEach(role => {
    copy[role] = { ...(defaultRolePermissions[role] ?? {}) };
  });
  return copy;
}

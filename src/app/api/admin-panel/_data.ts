import type {
  AdminUser,
  AuditLog,
  FeatureFlag,
  FeatureModule,
  HealthSnapshot,
  PageviewEvent,
  Role,
  SystemConfig,
} from '@/types/admin';
import type { UserRole } from '@/lib/types';

export const modulesSeed: FeatureModule[] = [
  { id: 'admin-dashboard', name: 'Dashboard Global', description: 'Indicadores e visão geral.', active: true, visibleInMenu: true },
  { id: 'admin-users', name: 'Usuários', description: 'Gestão de contas e status.', active: true, visibleInMenu: true },
  { id: 'admin-roles', name: 'Papéis e Permissões', description: 'RBAC e escopo de acesso.', active: true, visibleInMenu: true },
  { id: 'admin-modules', name: 'Módulos e Flags', description: 'Habilitação de módulos e experimentos.', active: true, visibleInMenu: true },
  { id: 'admin-analytics', name: 'Métricas e Acessos', description: 'Pageviews e tendências.', active: true, visibleInMenu: true, beta: true },
  { id: 'admin-audit', name: 'Auditoria', description: 'Trilhas e comparativos.', active: true, visibleInMenu: true },
  { id: 'admin-config', name: 'Configurações', description: 'Padrões globais e segurança.', active: true, visibleInMenu: true },
  { id: 'admin-health', name: 'Healthcheck', description: 'Disponibilidade e dependências.', active: true, visibleInMenu: true },
  { id: 'indicators', name: 'Indicadores', description: 'Painel operacional do app.', active: true, visibleInMenu: true },
  { id: 'incidents', name: 'Incidentes', description: 'Registro e tratativa de incidentes.', active: true, visibleInMenu: true },
  { id: 'rncs', name: 'RNCs', description: 'Não conformidades e inspeções.', active: true, visibleInMenu: true },
  { id: 'categories', name: 'Categorias', description: 'Classificação de itens.', active: true, visibleInMenu: true },
  { id: 'suppliers', name: 'Fornecedores', description: 'Gestão de terceiros.', active: true, visibleInMenu: true },
  { id: 'tools', name: 'Almoxarifado', description: 'Controle de ferramentas.', active: true, visibleInMenu: true },
];

export const flagsSeed: FeatureFlag[] = [
  { key: 'tracking.enabled', label: 'Tracking de Pageview', description: 'Captura pageviews do app.', enabled: true, moduleId: 'admin-analytics' },
  { key: 'errors.alerting', label: 'Alertas de Erro', description: 'Alerta erros por minuto.', enabled: true, moduleId: 'admin-audit' },
  { key: 'ui.beta-shell', label: 'Shell Beta', description: 'Layout beta visível.', enabled: false, moduleId: 'admin-modules' },
];

const permission = (module: string, action: string) => ({
  id: `${module}:${action}`,
  module,
  action,
});

export const rolesSeed: Role[] = [
  {
    id: 'admin',
    name: 'Administrador',
    description: 'Acesso total ao painel.',
    permissions: [
      permission('dashboard', 'view'),
      permission('users', 'manage'),
      permission('roles', 'manage'),
      permission('modules', 'manage'),
      permission('analytics', 'view'),
      permission('audit', 'view'),
      permission('config', 'edit'),
      permission('health', 'view'),
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'governanca',
    name: 'Governança',
    description: 'Gerencia permissões e módulos.',
    permissions: [
      permission('dashboard', 'view'),
      permission('users', 'manage'),
      permission('roles', 'manage'),
      permission('modules', 'manage'),
      permission('audit', 'view'),
      permission('config', 'edit'),
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'auditor',
    name: 'Auditor',
    description: 'Consulta logs e acessos.',
    permissions: [
      permission('dashboard', 'view'),
      permission('analytics', 'view'),
      permission('audit', 'view'),
      permission('health', 'view'),
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'operador',
    name: 'Operador',
    description: 'Executa ações operacionais controladas.',
    permissions: [
      permission('dashboard', 'view'),
      permission('analytics', 'view'),
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export let adminUsers: AdminUser[] = [
  {
    id: 'u-admin',
    name: 'Helena Ramos',
    email: 'helena.ramos@empresa.com',
    role: 'admin' as UserRole,
    status: 'active',
    lastAccessAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    permissions: rolesSeed[0].permissions.map((p) => p.id),
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
  },
  {
    id: 'u-gov',
    name: 'Marcos Silva',
    email: 'marcos.silva@empresa.com',
    role: 'gestor' as UserRole,
    status: 'active',
    lastAccessAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    permissions: rolesSeed[1].permissions.map((p) => p.id),
    department: 'Governança',
    avatarUrl: 'https://i.pravatar.cc/150?img=12',
  },
  {
    id: 'u-auditor',
    name: 'Carla Duarte',
    email: 'carla.duarte@empresa.com',
    role: 'regional' as UserRole,
    status: 'active',
    lastAccessAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    permissions: rolesSeed[2].permissions.map((p) => p.id),
    avatarUrl: 'https://i.pravatar.cc/150?img=32',
  },
  {
    id: 'u-ops',
    name: 'Diego Melo',
    email: 'diego.melo@empresa.com',
    role: 'usuario' as UserRole,
    status: 'active',
    lastAccessAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    permissions: rolesSeed[3].permissions.map((p) => p.id),
    avatarUrl: 'https://i.pravatar.cc/150?img=41',
  },
  // Demo accounts added to mirror DB-seeded demo users
  {
    id: 'demo-a',
    name: 'Demo A',
    email: 'demo.a@demo.local',
    role: 'usuario' as UserRole,
    status: 'active',
    lastAccessAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    permissions: rolesSeed[3].permissions.map((p) => p.id),
    avatarUrl: 'https://i.pravatar.cc/150?img=21',
  },
  {
    id: 'demo-b',
    name: 'Demo B (Bloqueado)',
    email: 'demo.b@demo.local',
    role: 'usuario' as UserRole,
    status: 'blocked',
    lastAccessAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    permissions: rolesSeed[3].permissions.map((p) => p.id),
    avatarUrl: 'https://i.pravatar.cc/150?img=22',
  },
  {
    id: 'demo-gestor',
    name: 'Demo Gestor',
    email: 'demo.gestor@demo.local',
    role: 'gestor' as UserRole,
    status: 'active',
    lastAccessAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    permissions: rolesSeed[1].permissions.map((p) => p.id),
    avatarUrl: 'https://i.pravatar.cc/150?img=23',
  },
];

export let featureModules: FeatureModule[] = [...modulesSeed];
export let featureFlags: FeatureFlag[] = [...flagsSeed];
export let roles: Role[] = [...rolesSeed];

export let auditLogs: AuditLog[] = [
  {
    id: 'audit-1',
    userId: 'u-admin',
    userName: 'Helena Ramos',
    entity: 'module',
    entityId: 'admin-analytics',
    action: 'enable',
    before: { active: false },
    after: { active: true },
    ip: '187.66.10.1',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    userAgent: 'Chrome 124',
    location: 'Fortaleza, BR',
  },
  {
    id: 'audit-2',
    userId: 'u-gov',
    userName: 'Marcos Silva',
    entity: 'role',
    entityId: 'auditor',
    action: 'permission.update',
    before: { permissions: ['dashboard:view'] },
    after: { permissions: ['dashboard:view', 'audit:view'] },
    ip: '177.23.10.2',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    userAgent: 'Chrome 124',
    location: 'Recife, BR',
  },
  {
    id: 'audit-3',
    userId: 'u-admin',
    userName: 'Helena Ramos',
    entity: 'user',
    entityId: 'u-ops',
    action: 'user.block',
    before: { status: 'active' },
    after: { status: 'blocked' },
    ip: '187.66.10.1',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    userAgent: 'Chrome 124',
    location: 'Fortaleza, BR',
  },
];

// Prepend a couple of very recent audit entries so the "Últimas ações administrativas" widget shows activity
(() => {
  const recent = [
    {
      id: 'audit-recent-1',
      userId: 'u-admin',
      userName: 'Helena Ramos',
      entity: 'user',
      entityId: 'demo-a',
      action: 'user.login',
      before: {},
      after: { status: 'active' },
      ip: '187.66.10.1',
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      userAgent: 'Chrome 124',
      location: 'Fortaleza, BR',
    },
    {
      id: 'audit-recent-2',
      userId: 'u-gov',
      userName: 'Marcos Silva',
      entity: 'module',
      entityId: 'admin-analytics',
      action: 'config.update',
      before: { tracking: true },
      after: { tracking: false },
      ip: '177.23.10.2',
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      userAgent: 'Chrome 124',
      location: 'Recife, BR',
    },
  ];
  auditLogs = [...recent, ...auditLogs].slice(0, 300);
})();



const sampleRoutes = ['/indicators', '/analytics', '/audit', '/modules', '/config', '/health'];

// Generate a richer set of pageview events spanning the last 30 days so dashboard widgets show meaningful data.
export let pageviewEvents: PageviewEvent[] = (() => {
  const days = 30;
  const events: PageviewEvent[] = [];
  const base = Date.now();
  // deterministic pseudo-random to keep values stable between restarts
  let seed = 12345;
  function rnd() { seed = (seed * 48271) % 2147483647; return seed / 2147483647; }

  for (let d = 0; d < days; d++) {
    // one timestamp per day at midnight UTC-3 (approx local)
    const dayTs = new Date(base - d * 24 * 60 * 60 * 1000);
    dayTs.setHours(0, 0, 0, 0);
    // generate between 50 and 250 pageviews per day
    const count = Math.round(50 + rnd() * 200);
    for (let i = 0; i < count; i++) {
      const minuteOffset = Math.floor(rnd() * 24 * 60);
      const ts = new Date(dayTs.getTime() + minuteOffset * 60 * 1000).toISOString();
      const idx = events.length;
      events.push({
        id: `pv-${idx}`,
        userId: adminUsers[idx % adminUsers.length]?.id,
        route: sampleRoutes[idx % sampleRoutes.length],
        device: ['iOS', 'Android', 'Web'][idx % 3],
        browser: ['Chrome', 'Safari', 'Firefox'][idx % 3],
        country: 'BR',
        city: idx % 2 === 0 ? 'Fortaleza' : 'Recife',
        createdAt: ts,
        sessionId: `s-${Math.floor(idx / 20)}`,
      });
    }
  }
  // keep newest first as other code expects
  return events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
})();

// Add a small burst of very recent activity so realtime widgets show non-zero values (activeUsers5m, rpm, deviceSplit)
(() => {
  const now = Date.now();
  const recent: PageviewEvent[] = [];
  const routes = sampleRoutes;
  const devs = ['Web', 'iOS', 'Android'];
  for (let i = 0; i < 24; i++) {
    const ts = new Date(now - Math.floor(Math.random() * 4 * 60 * 1000)).toISOString(); // within last 4 minutes
    recent.push({
      id: nextId('pv'),
      userId: adminUsers[i % adminUsers.length]?.id,
      route: routes[i % routes.length],
      device: devs[i % devs.length],
      browser: ['Chrome', 'Safari', 'Firefox'][i % 3],
      country: 'BR',
      city: i % 2 === 0 ? 'Fortaleza' : 'Recife',
      createdAt: ts,
      sessionId: `s-recent-${i}`,
    });
  }
  pageviewEvents = [...recent, ...pageviewEvents].slice(0, 2000);
})();

export let systemConfig: SystemConfig = {
  name: 'Painel ABC',
  defaultTheme: 'light',
  defaultTimezone: 'America/Sao_Paulo',
  defaultLocale: 'pt-BR',
  logoUrl: '/logo.svg',
  security: {
    sessionExpirationMinutes: 60,
    passwordPolicy: { minLength: 10, requireNumber: true, requireSpecial: true },
  },
  monitoring: {
    trackingEnabled: true,
    errorAlertThreshold: 10,
    rpmAlertThreshold: 120,
  },
};

export function setSystemConfig(cfg: SystemConfig) {
  systemConfig = cfg;
  return systemConfig;
}

export let healthSnapshot: HealthSnapshot = {
  status: 'healthy',
  uptimeSeconds: 86400 * 12,
  version: '2.3.1',
  dependencies: [
    { name: 'mapeamento', status: 'healthy', lastChecked: new Date().toISOString(), latencyMs: 18 },
    { name: 'redis', status: 'healthy', lastChecked: new Date().toISOString(), latencyMs: 6 },
    { name: 'search-api', status: 'degraded', lastChecked: new Date().toISOString(), latencyMs: 220, details: 'Latência acima do normal' },
  ],
  lastErrors: [
    {
      id: 'err-1',
      message: 'Timeout ao acessar search-api',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      service: 'search-api',
      statusCode: 504,
    },
    {
      id: 'err-recent-1',
      message: 'Erro 500 em /api/indicators',
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      service: 'app-server',
      statusCode: 500,
    },
  ],
};

export function nextId(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2, 8)}`;
}

export function recordAudit(entry: Omit<AuditLog, 'id' | 'timestamp'>) {
  const log: AuditLog = { id: nextId('audit'), timestamp: new Date().toISOString(), ...entry };
  auditLogs = [log, ...auditLogs].slice(0, 300);
  return log;
}
const TOKEN_SECRET = 'admin-panel-mock-secret';
const TOKEN_EXP_SECONDS = 60 * 60; // 1h
const REFRESH_EXP_SECONDS = 60 * 60 * 24 * 7; // 7d

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString('base64url');
}

function hmac(data: string) {
  return base64url(require('crypto').createHmac('sha256', TOKEN_SECRET).update(data).digest());
}

function sign(payload: Record<string, any>) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const h = base64url(JSON.stringify(header));
  const p = base64url(JSON.stringify(payload));
  const sig = hmac(`${h}.${p}`);
  return `${h}.${p}.${sig}`;
}

function verify(token?: string | null) {
  if (!token) return { valid: false } as const;
  const parts = token.split('.');
  if (parts.length !== 3) return { valid: false } as const;
  const [h, p, sig] = parts;
  const expected = hmac(`${h}.${p}`);
  if (sig !== expected) return { valid: false } as const;
  try {
    const payload = JSON.parse(Buffer.from(p, 'base64url').toString('utf-8'));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return { valid: false } as const;
    }
    return { valid: true, payload };
  } catch {
    return { valid: false } as const;
  }
}

export function issueAccessToken(userId: string, role: string) {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_EXP_SECONDS;
  return sign({ sub: userId, role, exp, type: 'access' });
}

export function issueRefreshToken(userId: string) {
  const exp = Math.floor(Date.now() / 1000) + REFRESH_EXP_SECONDS;
  return sign({ sub: userId, type: 'refresh', exp });
}

export function verifyAccessToken(token?: string | null) {
  const res = verify(token);
  if (!res.valid) return { valid: false as const };
  const payload = res.payload as any;
  if (payload.type !== 'access' || !payload.sub) return { valid: false as const };
  return { valid: true as const, userId: payload.sub as string, role: payload.role as string, exp: payload.exp as number };
}

export function verifyRefreshToken(token?: string | null) {
  const res = verify(token);
  if (!res.valid) return { valid: false as const };
  const payload = res.payload as any;
  if (payload.type !== 'refresh' || !payload.sub) return { valid: false as const };
  return { valid: true as const, userId: payload.sub as string, exp: payload.exp as number };
}

export function recordPageview(event: Omit<PageviewEvent, 'id' | 'createdAt'>) {
  const full: PageviewEvent = { id: nextId('pv'), createdAt: new Date().toISOString(), ...event };
  pageviewEvents = [full, ...pageviewEvents].slice(0, 1000);
  return full;
}

export function upsertUser(user: AdminUser) {
  const idx = adminUsers.findIndex((u) => u.id === user.id);
  if (idx >= 0) {
    adminUsers[idx] = user;
  } else {
    adminUsers = [user, ...adminUsers];
  }
  return user;
}

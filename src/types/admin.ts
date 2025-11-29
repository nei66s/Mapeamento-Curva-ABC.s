import type { UserRole } from '@/lib/types';

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  permissions: string[];
  lastLoginAt?: string;
  avatarUrl?: string;
};

export type UserStatus = 'active' | 'inactive' | 'blocked';

export type Role = {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
};

export type Permission = {
  id: string;
  module: string;
  action: string;
  description?: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roles?: Role[];
  status: UserStatus;
  permissions?: string[];
  lastAccessAt?: string;
  createdAt?: string;
  avatarUrl?: string;
  department?: string;
  blockedReason?: string | null;
};

export type FeatureModule = {
  id: string;
  name: string;
  description: string;
  active: boolean;
  visibleInMenu: boolean;
  beta?: boolean;
  experimental?: boolean;
  dependencies?: string[];
  owner?: string;
  updatedAt?: string;
};

export type FeatureFlag = {
  key: string;
  label: string;
  description?: string;
  enabled: boolean;
  moduleId?: string;
  audience?: string;
};

export type PageviewEvent = {
  id: string;
  userId?: string;
  route: string;
  device?: string;
  browser?: string;
  country?: string;
  city?: string;
  createdAt: string;
  sessionId?: string;
};

export type TimeSeriesPoint = {
  timestamp: string;
  value: number;
  label?: string;
};

export type TopRouteStat = {
  route: string;
  count: number;
};

export type HeatmapBucket = {
  hour: number;
  count: number;
};

export type RealtimeUsage = {
  activeUsers5m: number;
  activeUsers1h: number;
  activeUsers24h: number;
  currentSessions: number;
  rpm: number;
  errorsPerMinute: number;
  errorsLast24h: number;
  topRoutes: TopRouteStat[];
  deviceSplit: { label: string; value: number }[];
};

export type AuditLog = {
  id: string;
  userId?: string;
  userName?: string;
  entity: string;
  entityId?: string;
  action: string;
  timestamp: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ip?: string;
  userAgent?: string;
  location?: string;
};

export type AuditFilter = {
  userId?: string;
  action?: string;
  entity?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

export type SystemConfig = {
  name: string;
  logoUrl?: string;
  defaultTheme: 'light' | 'dark';
  defaultTimezone: string;
  defaultLocale: string;
  security: SecurityConfig;
  monitoring: MonitoringConfig;
};

export type SecurityConfig = {
  sessionExpirationMinutes: number;
  passwordPolicy: {
    minLength: number;
    requireNumber: boolean;
    requireSpecial: boolean;
  };
};

export type MonitoringConfig = {
  trackingEnabled: boolean;
  errorAlertThreshold: number;
  rpmAlertThreshold: number;
};

export type DependencyHealth = {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  lastChecked: string;
  latencyMs?: number;
  details?: string;
};

export type ErrorLog = {
  id: string;
  message: string;
  stack?: string;
  timestamp: string;
  service?: string;
  statusCode?: number;
};

export type HealthSnapshot = {
  status: 'healthy' | 'degraded' | 'down';
  uptimeSeconds: number;
  version: string;
  dependencies: DependencyHealth[];
  lastErrors: ErrorLog[];
};

export type TrackingEventInput = {
  type: 'pageview' | 'action';
  userId?: string;
  route?: string;
  name?: string;
  payload?: Record<string, unknown>;
  device?: string;
  browser?: string;
  sessionId?: string;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type AdminSession = {
  user: { id: string; email: string; role: string };
  permissions: Record<string, boolean>;
  activeModules: Record<string, boolean>;
  featureFlags: Record<string, boolean>;
};

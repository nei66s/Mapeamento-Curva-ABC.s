-- Migration: create admin/authorization tables and map existing users
BEGIN;

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

-- Role <-> Permission mapping
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  -- use TEXT columns to remain compatible with installations where ids are not integers
  role_id TEXT,
  permission_id TEXT,
  UNIQUE (role_id, permission_id)
);

-- User <-> Role mapping
CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  -- use TEXT for user_id to remain compatible with existing `users.id` types
  -- some installations use TEXT ids; keeping this flexible avoids FK-type mismatches
  user_id TEXT,
  role_id TEXT,
  UNIQUE (user_id, role_id)
);

-- Admin dashboard settings
CREATE TABLE IF NOT EXISTS admin_dashboard_settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Admin modules
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  beta BOOLEAN NOT NULL DEFAULT FALSE,
  experimental BOOLEAN NOT NULL DEFAULT FALSE,
  dependencies TEXT[],
  owner TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Feature flags (toggled values used by admin panel)
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  label TEXT,
  description TEXT,
  module_id TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  audience TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tracking events used for metrics (pageviews, realtime, heatmap)
CREATE TABLE IF NOT EXISTS tracking_events (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  route TEXT NOT NULL,
  device TEXT,
  browser TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tracking_events_route_created_at ON tracking_events(route, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_events_user_created_at ON tracking_events(user_id, created_at DESC);

-- Default roles
-- Ensure description column exists for compatibility with older schemas
ALTER TABLE roles ADD COLUMN IF NOT EXISTS description TEXT;
-- If `roles` table didn't exist before this script, the ALTER is harmless after CREATE TABLE above.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='roles' AND column_name='name') THEN
    INSERT INTO roles (name, description) VALUES
      ('admin', 'Administrador do sistema'),
      ('gestor', 'Gestor'),
      ('regional', 'Regional'),
      ('visualizador', 'Visualizador'),
      ('fornecedor', 'Fornecedor'),
      ('usuario', 'Usuário padrão')
    ON CONFLICT (name) DO NOTHING;
  END IF;
END $$;

-- Ensure description column exists on permissions for compatibility
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS description TEXT;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='permissions' AND column_name='name') THEN
    INSERT INTO permissions (name, description) VALUES
      ('indicators','Painel de Indicadores'),
      ('releases','Lançamentos Mensais'),
      ('incidents','Registro de Incidentes'),
      ('rncs','Registros de Não Conformidade'),
      ('laudos','Gerar Laudo Técnico'),
      ('categories','Categorias de Itens'),
      ('matrix','Matriz de Itens'),
      ('compliance','Cronograma de Preventivas'),
      ('suppliers','Gestão de Fornecedores'),
      ('warranty','Controle de Garantias'),
      ('tools','Almoxarifado de Ferramentas'),
      ('assets','Gestão de Ativos'),
      ('vacations','Gestão de Férias'),
      ('settlement','Cartas de Quitação'),
      ('escopos','Criação de Escopos'),
      ('profile','Meu Perfil'),
      ('settings','Configurações'),
      ('about','Sobre a Plataforma'),
      ('users','Usuários'),
      ('administration','Administração'),
      ('admin-dashboard','Dashboard Global (Admin)'),
      ('admin-users','Usuários e Papéis'),
      ('admin-modules','Módulos e Flags'),
      ('admin-analytics','Métricas e Acessos'),
      ('admin-audit','Auditoria'),
      ('admin-config','Configurações do Sistema'),
      ('admin-health','Healthcheck'),
      ('admin-roles','Papéis e RBAC')
    ON CONFLICT (name) DO NOTHING;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='permissions' AND column_name='name')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='roles' AND column_name='name') THEN

    -- coarse-grained permissions
    INSERT INTO permissions (name, description) VALUES
      ('users.manage', 'Gerenciar usuários'),
      ('roles.manage', 'Gerenciar papéis'),
      ('dashboard.view', 'Acessar dashboard admin'),
      ('incidents.manage', 'Gerenciar incidentes')
    ON CONFLICT (name) DO NOTHING;

    -- Map admin role to all permissions (admin => full access)
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id::text, p.id::text
    FROM roles r, permissions p
    WHERE r.name = 'admin'
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Map `gestor` (almost full access except top-level administration flag)
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id::text, p.id::text FROM roles r JOIN permissions p ON p.name IN (
      'indicators','releases','incidents','rncs','categories','matrix','compliance','suppliers','warranty','tools','assets','settlement','vacations','escopos','profile','settings','about','users','admin-dashboard','admin-users','admin-modules','admin-analytics','admin-audit','admin-config','admin-health','admin-roles'
    )
    WHERE r.name = 'gestor'
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Map `regional`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id::text, p.id::text FROM roles r JOIN permissions p ON p.name IN (
      'indicators','incidents','rncs','matrix','compliance','warranty','tools','assets','escopos','profile','settings','about'
    )
    WHERE r.name = 'regional'
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Map `visualizador`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id::text, p.id::text FROM roles r JOIN permissions p ON p.name IN (
      'indicators','profile','about'
    )
    WHERE r.name = 'visualizador'
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Map `fornecedor`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id::text, p.id::text FROM roles r JOIN permissions p ON p.name IN (
      'settlement','profile','settings','about'
    )
    WHERE r.name = 'fornecedor'
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Map `usuario` (default user)
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id::text, p.id::text FROM roles r JOIN permissions p ON p.name IN (
      'indicators','profile','settings','about'
    )
    WHERE r.name = 'usuario'
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Assign existing users with textual `role` to normalized `user_roles`
    INSERT INTO user_roles (user_id, role_id)
    SELECT u.id::text, r.id::text
    FROM users u
    JOIN roles r ON LOWER(u.role) = LOWER(r.name)
    ON CONFLICT (user_id, role_id) DO NOTHING;

  END IF;
END $$;

COMMIT;

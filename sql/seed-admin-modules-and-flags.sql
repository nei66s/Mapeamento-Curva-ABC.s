-- Seed sample modules and feature flags for admin dashboard
-- Safe to run multiple times: uses ON CONFLICT to update

-- Modules: key, name, is_active, is_visible
INSERT INTO modules (key, name, description, is_active, is_visible, beta)
VALUES
  ('admin-dashboard', 'Dashboard Global', 'Indicadores e visão geral.', true, true, false),
  ('admin-users', 'Usuários', 'Gestão de contas e status.', true, true, false),
  ('admin-roles', 'Papéis e Permissões', 'RBAC e escopo de acesso.', true, true, false),
  ('admin-modules', 'Módulos e Flags', 'Habilitação de módulos e experimentos.', true, true, false),
  ('admin-analytics', 'Métricas e Acessos', 'Pageviews e tendências.', true, true, true),
  ('admin-audit', 'Auditoria', 'Trilhas e comparativos.', true, true, false),
  ('admin-config', 'Configurações', 'Padrões globais e segurança.', true, true, false),
  ('admin-health', 'Healthcheck', 'Disponibilidade e dependências.', true, true, false),
  ('indicators', 'Indicadores', 'Painel operacional do app.', true, true, false),
  ('incidents', 'Incidentes', 'Registro e tratativa de incidentes.', true, true, false),
  ('rncs', 'RNCs', 'Não conformidades e inspeções.', true, true, false),
  ('categories', 'Categorias', 'Classificação de itens.', true, true, false),
  ('suppliers', 'Fornecedores', 'Gestão de terceiros.', true, true, false),
  ('tools', 'Almoxarifado', 'Controle de ferramentas.', true, true, false)
ON CONFLICT (key) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      is_active = EXCLUDED.is_active,
      is_visible = EXCLUDED.is_visible,
      beta = EXCLUDED.beta,
      updated_at = now();

-- Feature flags: key, enabled
INSERT INTO feature_flags (key, label, description, module_id, enabled)
VALUES
  ('tracking.enabled', 'Tracking de Pageview', 'Captura pageviews do app.', 'admin-analytics', true),
  ('errors.alerting', 'Alertas de Erro', 'Alerta erros por minuto.', 'admin-audit', true),
  ('ui.beta-shell', 'Shell Beta', 'Layout beta visível.', 'admin-modules', false)
ON CONFLICT (key) DO UPDATE
  SET label = EXCLUDED.label,
      description = EXCLUDED.description,
      module_id = EXCLUDED.module_id,
      enabled = EXCLUDED.enabled,
      updated_at = now();

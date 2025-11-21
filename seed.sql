-- Cria tabelas essenciais e popula dados de teste para a aplicação
BEGIN;

-- users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  role TEXT,
  password TEXT,
  avatarUrl TEXT,
  supplier_id TEXT,
  department TEXT
);

-- suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  contact TEXT,
  contact_email TEXT,
  cnpj TEXT,
  specialty TEXT
);

-- categories
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE
);

-- items
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  classification TEXT,
  impact_factors JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'offline',
  contingency_plan TEXT DEFAULT '',
  lead_time TEXT DEFAULT '',
  image_url TEXT
);

-- stores
CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE,
  location TEXT
);

-- store_items (join)
CREATE TABLE IF NOT EXISTS store_items (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  CONSTRAINT fk_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  CONSTRAINT fk_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  UNIQUE (store_id, item_id)
);

-- impact_factors
CREATE TABLE IF NOT EXISTS impact_factors (
  id TEXT PRIMARY KEY,
  label TEXT,
  description TEXT
);

-- contingency_plans
CREATE TABLE IF NOT EXISTS contingency_plans (
  id SERIAL PRIMARY KEY,
  description TEXT UNIQUE
);

-- lead_times
CREATE TABLE IF NOT EXISTS lead_times (
  id SERIAL PRIMARY KEY,
  description TEXT UNIQUE
);

-- placeholder_images
CREATE TABLE IF NOT EXISTS placeholder_images (
  id TEXT PRIMARY KEY,
  description TEXT,
  imageUrl TEXT,
  imageHint TEXT
);

-- incidents
CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY,
  item_name TEXT,
  location TEXT,
  description TEXT,
  lat DOUBLE PRECISION DEFAULT 0,
  lng DOUBLE PRECISION DEFAULT 0,
  status TEXT DEFAULT 'Aberto',
  opened_at TIMESTAMPTZ DEFAULT now()
);

-- warranty_items
CREATE TABLE IF NOT EXISTS warranty_items (
  id SERIAL PRIMARY KEY,
  item_name TEXT,
  store_location TEXT,
  serial_number TEXT,
  purchase_date TIMESTAMPTZ,
  warranty_end_date TIMESTAMPTZ,
  supplier_id TEXT,
  notes TEXT
);

-- technicians (assinam laudos e recebem ferramentas)
CREATE TABLE IF NOT EXISTS technicians (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- tools inventory
CREATE TABLE IF NOT EXISTS tools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  serial_number TEXT,
  status TEXT NOT NULL DEFAULT 'Disponível',
  assigned_to TEXT,
  purchase_date DATE,
  last_maintenance TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- asset inventory (registro temporário de ativos e hierarquia)
CREATE TABLE IF NOT EXISTS asset_inventory (
  id TEXT PRIMARY KEY,
  store_id TEXT,
  store_name TEXT,
  name TEXT NOT NULL,
  patrimony TEXT,
  hierarchy TEXT,
  description TEXT,
  complexity TEXT,
  cost_estimate TEXT,
  risk_notes TEXT,
  insumos JSONB DEFAULT '[]'::jsonb,
  componentes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- technical reports (laudos)
CREATE TABLE IF NOT EXISTS technical_reports (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  technician_id TEXT REFERENCES technicians(id) ON DELETE SET NULL,
  incident_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'Pendente',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- vacation requests
CREATE TABLE IF NOT EXISTS vacation_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_department TEXT,
  status TEXT NOT NULL DEFAULT 'Aprovado',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT now(),
  total_days INTEGER DEFAULT 0
);

-- unsalvageable items
CREATE TABLE IF NOT EXISTS unsalvageable_items (
  id SERIAL PRIMARY KEY,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  reason TEXT,
  request_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  requester_id TEXT,
  status TEXT NOT NULL DEFAULT 'Pendente',
  disposal_date TIMESTAMPTZ
);

-- settlement letters (nova estrutura)
CREATE TABLE IF NOT EXISTS settlement_letters (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  supplier_id TEXT,
  period_start_date TIMESTAMPTZ,
  period_end_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'Pendente',
  received_date TIMESTAMPTZ,
  file_url TEXT
);

-- =========================
-- Inserções de dados de teste
-- =========================

-- Users (do migrate-users.ts)
INSERT INTO users (name, email, role, password, avatarUrl, department) VALUES
  ('Admin', 'admin@gmail.com', 'admin', 'admin', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Administração')
  ON CONFLICT (email) DO NOTHING;

INSERT INTO users (name, email, role, password, avatarUrl, department) VALUES
  ('Bruno Costa', 'gestor@example.com', 'gestor', 'gestor', 'https://picsum.photos/seed/user2/100/100', 'Manutenção Elétrica')
  ON CONFLICT (email) DO NOTHING;

INSERT INTO users (name, email, role, password, avatarUrl, department) VALUES
  ('Carlos Dias', 'regional@example.com', 'regional', 'regional', 'https://picsum.photos/seed/user3/100/100', 'Manutenção Mecânica')
  ON CONFLICT (email) DO NOTHING;

INSERT INTO users (name, email, role, password, avatarUrl, department) VALUES
  ('Daniela Faria', 'visualizador@example.com', 'visualizador', 'visualizador', 'https://picsum.photos/seed/user4/100/100', 'Manutenção Civil')
  ON CONFLICT (email) DO NOTHING;

-- Suppliers iniciais
INSERT INTO suppliers (name, contact, contact_email, cnpj, specialty) VALUES
  ('Alpha Facilities', 'João Mendes', 'contato@alpha.com', '12.345.678/0001-01', 'Manutenção Predial'),
  ('ClimaTech', 'Maria Souza', 'maria@climatech.com', '98.765.432/0001-55', 'HVAC'),
  ('SecureIT', 'Carlos Ramos', 'carlos@secureit.com', '11.222.333/0001-44', 'Segurança Eletrônica')
ON CONFLICT (name) DO NOTHING;

-- Stores (from mock-simple.ts)
INSERT INTO stores (name, location) VALUES
  ('Loja 01 - Americana', 'Americana'),
  ('Loja 02 - Santa Bárbara', 'Santa Bárbara d''Oeste'),
  ('Loja 03 - Nova Odessa', 'Nova Odessa'),
  ('Loja 04 - Campinas', 'Campinas'),
  ('Loja 05 - Piracicaba', 'Piracicaba'),
  ('Loja 06 - Sumaré', 'Sumaré'),
  ('Loja 07 - Hortolândia', 'Hortolândia'),
  ('Loja 08 - Paulinia', 'Paulinia'),
  ('Loja 09 - Limeira', 'Limeira'),
  ('Loja 10 - Araras', 'Araras'),
  ('Loja 11 - Indaiatuba', 'Indaiatuba'),
  ('Loja 12 - Tietê', 'Tietê'),
  ('Loja 13 - Boituva', 'Boituva'),
  ('Loja 14 - Salto', 'Salto'),
  ('Loja 15 - Itu', 'Itu'),
  ('Loja 16 - Sorocaba', 'Sorocaba'),
  ('Loja 17 - Valinhos', 'Valinhos'),
  ('Loja 18 - Mogi Mirim', 'Mogi Mirim')
  ON CONFLICT (name) DO NOTHING;

-- Categories (deduzidas de mock-raw.ts)
INSERT INTO categories (name) VALUES
  ('Segurança / CFTV / Alarme'),
  ('Elétrica / Iluminação'),
  ('Refrigeração / Climatização Central'),
  ('Energização / Geradores / Nobreaks'),
  ('Hidráulica / Utilidades'),
  ('Infraestrutura Predial'),
  ('Açougue / Frios'),
  ('Rotisserie / Cozinha'),
  ('Padaria / Confeitaria'),
  ('Hortifrúti / Floricultura'),
  ('Depósito / Doca'),
  ('Limpeza e Apoio'),
  ('Estacionamento / Acessos / Cancelas'),
  ('Refeitório / Vestiários / Áreas de Apoio ao Colaborador'),
  ('Logo/ Painéis / Iluminação decorativa')
  ON CONFLICT (name) DO NOTHING;

-- Items (inserindo alguns itens de exemplo; mapeia categoria por nome)
-- Para facilitar: cada INSERT usa SELECT para achar category_id
INSERT INTO items (name, category_id, image_url) VALUES
  ('DVR / NVR Central', (SELECT id FROM categories WHERE name='Segurança / CFTV / Alarme'), 'https://picsum.photos/seed/item1/200/120')
  ON CONFLICT (name) DO NOTHING;

INSERT INTO items (name, category_id, image_url) VALUES
  ('Câmeras de frente de loja / cofres', (SELECT id FROM categories WHERE name='Segurança / CFTV / Alarme'), 'https://picsum.photos/seed/item2/200/120')
  ON CONFLICT (name) DO NOTHING;

INSERT INTO items (name, category_id, image_url) VALUES
  ('Sensores de presença / alarme', (SELECT id FROM categories WHERE name='Segurança / CFTV / Alarme'), 'https://picsum.photos/seed/item3/200/120')
  ON CONFLICT (name) DO NOTHING;

INSERT INTO items (name, category_id, image_url) VALUES
  ('QGBT / Quadro geral', (SELECT id FROM categories WHERE name='Elétrica / Iluminação'), 'https://picsum.photos/seed/item4/200/120')
  ON CONFLICT (name) DO NOTHING;

INSERT INTO items (name, category_id, image_url) VALUES
  ('Iluminação de área de vendas', (SELECT id FROM categories WHERE name='Elétrica / Iluminação'), 'https://picsum.photos/seed/item5/200/120')
  ON CONFLICT (name) DO NOTHING;

INSERT INTO items (name, category_id, image_url) VALUES
  ('Rack de compressores / unidade condensadora', (SELECT id FROM categories WHERE name='Refrigeração / Climatização Central'), 'https://picsum.photos/seed/item6/200/120')
  ON CONFLICT (name) DO NOTHING;

INSERT INTO items (name, category_id, image_url) VALUES
  ('Evaporadores / câmaras frias', (SELECT id FROM categories WHERE name='Refrigeração / Climatização Central'), 'https://picsum.photos/seed/item7/200/120')
  ON CONFLICT (name) DO NOTHING;

-- (adicione mais INSERTs para items conforme quiser; o projeto tem uma lista longa em src/lib/mock-raw.ts)

-- Additional items with full fields for testing (classification A/B/C, impact_factors JSONB, status, contingency_plan, lead_time)
INSERT INTO items (name, category_id, classification, impact_factors, status, contingency_plan, lead_time, image_url) VALUES
  ('Monitoramento NVR Primário', (SELECT id FROM categories WHERE name='Segurança / CFTV / Alarme'), 'A', '["safety","brand"]'::jsonb, 'online', 'Utilizar equipamento reserva.', '2 horas', 'https://picsum.photos/seed/item10/200/120'),
  ('Câmera Caixa Interna', (SELECT id FROM categories WHERE name='Segurança / CFTV / Alarme'), 'B', '["safety"]'::jsonb, 'online', 'Acionar equipe de manutenção interna.', '4 horas', 'https://picsum.photos/seed/item11/200/120'),
  ('Iluminação Emergência', (SELECT id FROM categories WHERE name='Elétrica / Iluminação'), 'A', '["safety","legal"]'::jsonb, 'online', 'Isolar a área e aguardar o técnico especialista.', 'Imediato', 'https://picsum.photos/seed/item12/200/120'),
  ('Painel Elétrico Auxiliar', (SELECT id FROM categories WHERE name='Elétrica / Iluminação'), 'B', '["cost","sales"]'::jsonb, 'online', 'Contratar serviço de locação de equipamento similar.', '24 horas', 'https://picsum.photos/seed/item13/200/120'),
  ('Freezer Expositor 2 portas', (SELECT id FROM categories WHERE name='Refrigeração / Climatização Central'), 'A', '["sales","cost"]'::jsonb, 'online', 'Utilizar equipamento reserva.', '8 horas', 'https://picsum.photos/seed/item14/200/120'),
  ('Evaporador Reserva', (SELECT id FROM categories WHERE name='Refrigeração / Climatização Central'), 'B', '["sales"]'::jsonb, 'offline', 'Acionar equipe de manutenção interna.', '48 horas', 'https://picsum.photos/seed/item15/200/120'),
  ('Forno Padaria Industrial', (SELECT id FROM categories WHERE name='Padaria / Confeitaria'), 'A', '["sales","cost"]'::jsonb, 'online', 'Contratar serviço de locação de equipamento similar.', '24 horas', 'https://picsum.photos/seed/item16/200/120'),
  ('Balcão Refrigerado Hortifrúti', (SELECT id FROM categories WHERE name='Hortifrúti / Floricultura'), 'B', '["sales"]'::jsonb, 'online', 'Utilizar equipamento reserva.', '4 horas', 'https://picsum.photos/seed/item17/200/120'),
  ('Sistema de Backup de Energia', (SELECT id FROM categories WHERE name='Energização / Geradores / Nobreaks'), 'A', '["safety","sales","cost"]'::jsonb, 'online', 'Utilizar equipamento reserva.', '2 horas', 'https://picsum.photos/seed/item18/200/120'),
  ('Corta-corrente Estacionamento', (SELECT id FROM categories WHERE name='Estacionamento / Acessos / Cancelas'), 'C', '["brand"]'::jsonb, 'offline', 'Redirecionar fluxo de clientes.', '48 horas', 'https://picsum.photos/seed/item19/200/120'),
  ('Máquina de Café Refeitório', (SELECT id FROM categories WHERE name='Refeitório / Vestiários / Áreas de Apoio ao Colaborador'), 'C', '["cost"]'::jsonb, 'offline', 'Iniciar operação em modo de contingência manual.', '48 horas', 'https://picsum.photos/seed/item20/200/120'),
  ('Painel Decorativo LED', (SELECT id FROM categories WHERE name='Logo/ Painéis / Iluminação decorativa'), 'C', '["brand"]'::jsonb, 'online', 'Isolar a área e aguardar o técnico especialista.', '24 horas', 'https://picsum.photos/seed/item21/200/120')
ON CONFLICT (name) DO UPDATE SET
  category_id = COALESCE(EXCLUDED.category_id, items.category_id),
  classification = COALESCE(EXCLUDED.classification, items.classification),
  impact_factors = COALESCE(EXCLUDED.impact_factors, items.impact_factors),
  status = COALESCE(EXCLUDED.status, items.status),
  contingency_plan = COALESCE(EXCLUDED.contingency_plan, items.contingency_plan),
  lead_time = COALESCE(EXCLUDED.lead_time, items.lead_time),
  image_url = COALESCE(EXCLUDED.image_url, items.image_url);

-- impact_factors (do migrate-impact-factors.ts)
INSERT INTO impact_factors (id, label, description) VALUES
  ('safety', 'Segurança', 'Risco de acidentes, lesões ou fatalidades para colaboradores ou clientes.'),
  ('sales', 'Produção/Vendas', 'Impacto direto na capacidade de produzir, vender ou na experiência de compra do cliente.'),
  ('legal', 'Legal/Normativo', 'Risco de multas, sanções ou não conformidade com regulamentações.'),
  ('brand', 'Imagem da Marca', 'Impacto negativo na percepção pública e na reputação da marca.'),
  ('cost', 'Custo de Reparo', 'Custo financeiro elevado para reparo ou substituição do item.')
  ON CONFLICT (id) DO NOTHING;

-- contingency_plans (do migrate-contingency-leadtimes.ts)
INSERT INTO contingency_plans (description) VALUES
  ('Acionar equipe de manutenção interna.'),
  ('Contratar serviço de locação de equipamento similar.'),
  ('Isolar a área e aguardar o técnico especialista.'),
  ('Utilizar equipamento reserva.'),
  ('Redirecionar fluxo de clientes.'),
  ('Iniciar operação em modo de contingência manual.')
  ON CONFLICT (description) DO NOTHING;

-- lead_times (do migrate-contingency-leadtimes.ts)
INSERT INTO lead_times (description) VALUES
  ('Imediato'),
  ('2 horas'),
  ('4 horas'),
  ('8 horas'),
  ('24 horas'),
  ('48 horas')
  ON CONFLICT (description) DO NOTHING;

-- placeholder_images (do migrate-images.ts)
INSERT INTO placeholder_images (id, description, imageUrl, imageHint) VALUES
  ('app-logo', 'The main logo for the application', '/logo.png', 'company logo'),
  ('user-avatar-1', 'User avatar placeholder', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'person avatar'),
  ('item-image-1', 'Air conditioner', 'https://images.unsplash.com/photo-1601993198415-19d86ae28424?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'air conditioner'),
  ('item-image-2', 'Security camera', 'https://images.unsplash.com/photo-1520697830682-bbb6e85e2b0b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'security camera'),
  ('item-image-3', 'Electrical panel', 'https://images.unsplash.com/photo-1566417108845-5ba9c2f9ea1b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'electrical panel'),
  ('item-image-4', 'Industrial freezer', 'https://images.unsplash.com/photo-1727947478281-1576560f10aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'industrial freezer'),
  ('item-image-5', 'Bakery oven', 'https://images.unsplash.com/photo-1694000103508-2a24d5c7ede1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'bakery oven')
  ON CONFLICT (id) DO NOTHING;

-- incidents (inserir um exemplo)
INSERT INTO incidents (id, item_name, location, description, lat, lng, status, opened_at) VALUES
  ('INC-SEED-001', 'Exemplo Item A', 'Loja 01 - Americana', 'Incidente de amostra para desenvolvimento', 0, 0, 'Aberto', now())
  ON CONFLICT (id) DO NOTHING;

-- store_items: associe alguns itens às primeiras lojas (exemplo)
-- pega ids das stores e items por name (assume inserts acima)
INSERT INTO store_items (store_id, item_id)
SELECT s.id, i.id
FROM stores s, items i
WHERE s.name IN ('Loja 01 - Americana','Loja 02 - Santa Bárbara','Loja 03 - Nova Odessa')
  AND i.name IN ('DVR / NVR Central','Câmeras de frente de loja / cofres','QGBT / Quadro geral')
ON CONFLICT (store_id, item_id) DO NOTHING;

-- =========================
-- Technicians
INSERT INTO technicians (id, name, role, avatar_url) VALUES
  ('tech-001', 'Fulano de Tal', 'Técnico de Refrigeração', 'https://picsum.photos/seed/tech1/100/100'),
  ('tech-002', 'Ciclano de Souza', 'Técnico Eletricista', 'https://picsum.photos/seed/tech2/100/100')
ON CONFLICT (id) DO NOTHING;

-- Tools inventory
INSERT INTO tools (id, name, category, serial_number, status, assigned_to, purchase_date, last_maintenance) VALUES
  ('tool-001', 'Furadeira de Impacto', 'Manual', 'FI-2024-001', 'Em Uso', (SELECT id::text FROM users WHERE email='gestor@example.com'), '2024-01-10', now() - interval '45 days'),
  ('tool-002', 'Multímetro Digital', 'Medição', 'MD-8899', 'Disponível', NULL, '2023-11-05', now() - interval '70 days'),
  ('tool-003', 'EPI - Detector de Voltagem', 'EPI', 'EPI-440V', 'Em Manutenção', (SELECT id::text FROM users WHERE email='regional@example.com'), '2023-09-14', now() - interval '10 days')
ON CONFLICT (id) DO NOTHING;

-- Technical reports (laudos)
INSERT INTO technical_reports (id, title, technician_id, incident_id, details, status, created_at) VALUES
  ('LTD-001', 'Avaliação rack de compressores', 'tech-001', 'INC-SEED-001', jsonb_build_object(
      'problemFound', 'Baixa de rendimento em compressor 2',
      'itemDiagnosis', 'Pressão irregular observada no circuito secundário',
      'recommendations', 'repair'
    ), 'Pendente', now() - interval '5 days'),
  ('LTD-002', 'Inspeção elétrica quadro geral', 'tech-002', NULL, jsonb_build_object(
      'problemFound', 'Aquecimento em barramentos',
      'itemDiagnosis', 'Oxidação em terminais principais',
      'recommendations', 'evaluate'
    ), 'Concluído', now() - interval '12 days')
ON CONFLICT (id) DO NOTHING;

-- Vacation requests de exemplo
INSERT INTO vacation_requests (id, user_id, user_department, status, start_date, end_date, requested_at, total_days) VALUES
  ('vac-001', (SELECT id::text FROM users WHERE email='gestor@example.com'), (SELECT department FROM users WHERE email='gestor@example.com'), 'Aprovado', '2025-08-01', '2025-08-15', now() - interval '40 days', 10),
  ('vac-002', (SELECT id::text FROM users WHERE email='regional@example.com'), (SELECT department FROM users WHERE email='regional@example.com'), 'Aprovado', '2025-09-05', '2025-09-20', now() - interval '30 days', 12)
ON CONFLICT (id) DO NOTHING;

-- Unsalvageable items de exemplo
INSERT INTO unsalvageable_items (id, item_name, quantity, reason, request_date, requester_id, status) VALUES
  (1, 'Freezer Expositor 2 portas', 1, 'Compressor queimado e gabinete com corrosão severa', now() - interval '15 days', (SELECT id::text FROM users WHERE email='gestor@example.com'), 'Pendente')
ON CONFLICT (id) DO NOTHING;

-- Settlement letters (nova estrutura)
INSERT INTO settlement_letters (id, title, content, date, supplier_id, period_start_date, period_end_date, status) VALUES
  ('SET-001', 'CT-2024-001', 'Carta de quitação referente ao serviço XYZ\nFornecedor: Alpha Facilities\nPeríodo: 01/05/2024 a 31/05/2024', now() - interval '10 days', (SELECT id::text FROM suppliers WHERE name='Alpha Facilities'), now() - interval '60 days', now() - interval '30 days', 'Pendente'),
  ('SET-002', 'CT-2024-002', 'Quitação parcial referente a manutenção\nFornecedor: ClimaTech\nPeríodo: 01/04/2024 a 30/04/2024', now() - interval '20 days', (SELECT id::text FROM suppliers WHERE name='ClimaTech'), now() - interval '90 days', now() - interval '60 days', 'Recebida')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Cria tabelas essenciais e popula dados de teste para a aplicação
BEGIN;

-- users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  role TEXT,
  password TEXT,
  avatarUrl TEXT
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

-- =========================
-- Inserções de dados de teste
-- =========================

-- Users (do migrate-users.ts)
INSERT INTO users (name, email, role, password, avatarUrl) VALUES
  ('Admin', 'admin@gmail.com', 'admin', 'admin', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080')
  ON CONFLICT (email) DO NOTHING;

INSERT INTO users (name, email, role, password, avatarUrl) VALUES
  ('Bruno Costa', 'gestor@example.com', 'gestor', 'gestor', 'https://picsum.photos/seed/user2/100/100')
  ON CONFLICT (email) DO NOTHING;

INSERT INTO users (name, email, role, password, avatarUrl) VALUES
  ('Carlos Dias', 'regional@example.com', 'regional', 'regional', 'https://picsum.photos/seed/user3/100/100')
  ON CONFLICT (email) DO NOTHING;

INSERT INTO users (name, email, role, password, avatarUrl) VALUES
  ('Daniela Faria', 'visualizador@example.com', 'visualizador', 'visualizador', 'https://picsum.photos/seed/user4/100/100')
  ON CONFLICT (email) DO NOTHING;

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
-- incidents (inserir um exemplo)
-- Insert without explicit id so it works regardless of the incidents.id column type
INSERT INTO incidents (item_name, location, description, lat, lng, status, opened_at) VALUES
  ('Exemplo Item A', 'Loja 01 - Americana', 'Incidente de amostra para desenvolvimento', 0, 0, 'Aberto', now())
  ON CONFLICT DO NOTHING;

-- store_items: associe alguns itens às primeiras lojas (exemplo)
-- pega ids das stores e items por name (assume inserts acima)
INSERT INTO store_items (store_id, item_id)
SELECT s.id, i.id
FROM stores s, items i
WHERE s.name IN ('Loja 01 - Americana','Loja 02 - Santa Bárbara','Loja 03 - Nova Odessa')
  AND i.name IN ('DVR / NVR Central','Câmeras de frente de loja / cofres','QGBT / Quadro geral')
ON CONFLICT (store_id, item_id) DO NOTHING;

-- =========================
-- Settlements (Cartas de Quitação)
-- =========================
CREATE TABLE IF NOT EXISTS settlements (
  id TEXT PRIMARY KEY,
  supplier_id TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  description TEXT,
  request_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  received_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'Pendente',
  period_start_date TIMESTAMPTZ,
  period_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Example seed data for settlements
INSERT INTO settlements (id, supplier_id, contract_id, description, request_date, received_date, status, period_start_date, period_end_date) VALUES
  ('SET-001', 'supplier-001', 'CT-2024-001', 'Carta de quitação referente ao serviço XYZ', now() - interval '10 days', null, 'Pendente', now() - interval '60 days', now() - interval '30 days'),
  ('SET-002', 'supplier-002', 'CT-2024-002', 'Quitação parcial referente a manutenção', now() - interval '20 days', now() - interval '5 days', 'Recebida', now() - interval '90 days', now() - interval '60 days')
ON CONFLICT (id) DO NOTHING;

COMMIT;

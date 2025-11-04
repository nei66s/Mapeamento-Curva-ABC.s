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
  ('inc-0001', 'Exemplo Item A', 'Loja 01 - Americana', 'Incidente de amostra para desenvolvimento', 0, 0, 'Aberto', now())
  ON CONFLICT (id) DO NOTHING;

-- store_items: associe alguns itens às primeiras lojas (exemplo)
-- pega ids das stores e items por name (assume inserts acima)
INSERT INTO store_items (store_id, item_id)
SELECT s.id, i.id
FROM stores s, items i
WHERE s.name IN ('Loja 01 - Americana','Loja 02 - Santa Bárbara','Loja 03 - Nova Odessa')
  AND i.name IN ('DVR / NVR Central','Câmeras de frente de loja / cofres','QGBT / Quadro geral')
ON CONFLICT (store_id, item_id) DO NOTHING;

COMMIT;

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

-- (truncated in canonical copy for brevity; full seed exists in root)

COMMIT;

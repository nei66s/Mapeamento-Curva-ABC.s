-- Migration: adiciona colunas description, image_url e classification na tabela categories
BEGIN;

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS classification TEXT DEFAULT 'C';

COMMIT;

-- Uso: psql -d <database> -f scripts/migrate-add-category-fields.sql

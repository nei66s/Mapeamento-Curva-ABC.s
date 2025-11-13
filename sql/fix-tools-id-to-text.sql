BEGIN;

-- Convert tools.id to TEXT so app-generated string IDs like 'tool-xxx' work.
-- This uses a safe USING clause to cast existing integer ids to text.

ALTER TABLE tools ALTER COLUMN id TYPE TEXT USING id::text;

-- If a sequence was attached to the integer PK, remove ownership to avoid warnings
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid WHERE c.relkind = 'S' AND c.relname LIKE 'tools_%') THEN
    -- best-effort: do not drop sequences automatically
    RAISE NOTICE 'Sequences possibly present; please review sequences attached to tools.id manually.';
  END IF;
END$$;

COMMIT;

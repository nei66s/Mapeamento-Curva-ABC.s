BEGIN;

CREATE TABLE IF NOT EXISTS action_board (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  owner TEXT NOT NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'Pendente',
  progress INTEGER NOT NULL DEFAULT 0,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS action_board_status_idx ON action_board (status);
CREATE INDEX IF NOT EXISTS action_board_due_date_idx ON action_board (due_date);

CREATE TABLE IF NOT EXISTS ai_insights (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  action TEXT,
  status TEXT NOT NULL DEFAULT 'Pendente',
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_insights_status_idx ON ai_insights (status);

COMMIT;

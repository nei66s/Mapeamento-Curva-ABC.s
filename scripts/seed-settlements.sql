-- Settlements (Cartas de Quitação) - seed file (isolated)
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

INSERT INTO settlements (id, supplier_id, contract_id, description, request_date, received_date, status, period_start_date, period_end_date) VALUES
  ('SET-001', 'supplier-001', 'CT-2024-001', 'Carta de quitação referente ao serviço XYZ', now() - interval '10 days', null, 'Pendente', now() - interval '60 days', now() - interval '30 days'),
  ('SET-002', 'supplier-002', 'CT-2024-002', 'Quitação parcial referente a manutenção', now() - interval '20 days', now() - interval '5 days', 'Recebida', now() - interval '90 days', now() - interval '60 days')
ON CONFLICT (id) DO NOTHING;

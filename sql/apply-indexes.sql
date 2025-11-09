-- Create performance indexes for production usage
-- Safe to run multiple times (IF NOT EXISTS)

-- items
CREATE INDEX IF NOT EXISTS idx_items_category ON items (category_id);
CREATE INDEX IF NOT EXISTS idx_items_classification ON items (classification);
CREATE INDEX IF NOT EXISTS idx_items_status ON items (status);

-- store_items
CREATE INDEX IF NOT EXISTS idx_store_items_store ON store_items (store_id);
CREATE INDEX IF NOT EXISTS idx_store_items_item ON store_items (item_id);

-- incidents
CREATE INDEX IF NOT EXISTS idx_incidents_opened_at ON incidents (opened_at);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents (status);
CREATE INDEX IF NOT EXISTS idx_incidents_item_name ON incidents (item_name);

-- tools
CREATE INDEX IF NOT EXISTS idx_tools_status ON tools (status);
CREATE INDEX IF NOT EXISTS idx_tools_assigned_to ON tools (assigned_to);

-- technicians
CREATE INDEX IF NOT EXISTS idx_technicians_name ON technicians (name);

-- technical_reports
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON technical_reports (created_at);
CREATE INDEX IF NOT EXISTS idx_reports_technician ON technical_reports (technician_id);

-- settlement_letters
CREATE INDEX IF NOT EXISTS idx_setl_date ON settlement_letters (date);
CREATE INDEX IF NOT EXISTS idx_setl_supplier ON settlement_letters (supplier_id);
CREATE INDEX IF NOT EXISTS idx_setl_status ON settlement_letters (status);

-- warranty_items
CREATE INDEX IF NOT EXISTS idx_warranty_supplier ON warranty_items (supplier_id);
CREATE INDEX IF NOT EXISTS idx_warranty_end ON warranty_items (warranty_end_date);

-- vacation_requests
CREATE INDEX IF NOT EXISTS idx_vac_user ON vacation_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_vac_start ON vacation_requests (start_date);
CREATE INDEX IF NOT EXISTS idx_vac_end ON vacation_requests (end_date);


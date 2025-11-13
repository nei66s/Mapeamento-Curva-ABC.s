// Central whitelist of tables used by the application.
// Exported so scripts and tests can reuse the same source of truth.
module.exports = [
  'users','categories','items','stores','store_items','suppliers',
  'incidents','warranty_items','impact_factors','contingency_plans','lead_times','placeholder_images',
  'technicians','tools','technical_reports','vacation_requests','unsalvageable_items','settlement_letters',
  'rncs','indicators','indicadores_lancamentos','lancamentos_mensais',
  'compliance_checklist_items','compliance_visits','store_compliance_data',
];

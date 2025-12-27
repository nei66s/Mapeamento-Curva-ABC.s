import pool from './db';

export type DataQualityMetric = {
  label: string;
  value: string;
  detail: string;
};

export type DataQualityAlert = {
  id: string;
  title: string;
  detail: string;
  severity: 'critical' | 'warning' | 'info';
};

export type DataQualityActivity = {
  title: string;
  when: string;
  detail: string;
  status: 'ok' | 'pending';
};

export type DataQualitySnapshot = {
  metrics: DataQualityMetric[];
  alerts: DataQualityAlert[];
  activity: DataQualityActivity[];
};

type CountRow = {
  total: number;
  missing_any: number;
  missing_detail?: number;
};

const formatPct = (value: number) => `${Math.round(value)}%`;

const toNumber = (value: any) => Number.parseInt(String(value ?? 0), 10) || 0;

async function getColumns(table: string): Promise<Set<string>> {
  const res = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
    [table]
  );
  return new Set(res.rows.map((row: any) => String(row.column_name || '').toLowerCase()).filter(Boolean));
}

function pickColumn(columns: Set<string>, candidates: string[]): string | null {
  for (const name of candidates) {
    const normalized = name.toLowerCase();
    if (columns.has(normalized)) return normalized;
  }
  return null;
}

function buildMissingQuery(table: string, conditions: string[]) {
  if (conditions.length === 0) {
    return `SELECT COUNT(*) AS total, 0 AS missing_any FROM ${table}`;
  }
  return `
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE ${conditions.join(' OR ')}) AS missing_any
    FROM ${table}
  `;
}

export async function getDataQualitySnapshot(): Promise<DataQualitySnapshot> {
  const [storeColumns, incidentColumns, warrantyColumns] = await Promise.all([
    getColumns('stores'),
    getColumns('incidents'),
    getColumns('warranty_items'),
  ]);

  const [
    suppliersColumns,
    itemsColumns,
    toolsColumns,
    assetInventoryColumns,
    settlementLettersColumns,
    technicalReportsColumns,
  ] = await Promise.all([
    getColumns('suppliers'),
    getColumns('items'),
    getColumns('tools'),
    getColumns('asset_inventory'),
    getColumns('settlement_letters'),
    getColumns('technical_reports'),
  ]);
  const hasStoreLat = storeColumns.has('lat');
  const hasStoreLng = storeColumns.has('lng');

  let suppliersRes;
  if (suppliersColumns.size > 0) {
    suppliersRes = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (
          WHERE contact IS NULL OR TRIM(COALESCE(contact::text, '')) = ''
            OR contact_email IS NULL OR TRIM(COALESCE(contact_email::text, '')) = ''
            OR cnpj IS NULL OR TRIM(COALESCE(cnpj::text, '')) = ''
            OR specialty IS NULL OR TRIM(COALESCE(specialty::text, '')) = ''
        ) AS missing_any
      FROM suppliers
    `);
  } else {
    suppliersRes = { rows: [{ total: 0, missing_any: 0 }] } as any;
  }

  let itemsRes;
  if (itemsColumns.size > 0) {
    itemsRes = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (
      WHERE category_id IS NULL
            OR classification IS NULL OR TRIM(COALESCE(classification::text, '')) = ''
            OR lead_time IS NULL OR TRIM(COALESCE(lead_time::text, '')) = ''
            OR contingency_plan IS NULL OR TRIM(COALESCE(contingency_plan::text, '')) = ''
            OR impact_factors IS NULL OR impact_factors = '[]'::jsonb
        ) AS missing_any,
        COUNT(*) FILTER (WHERE category_id IS NULL) AS missing_category,
        COUNT(*) FILTER (WHERE impact_factors IS NULL OR impact_factors = '[]'::jsonb) AS missing_impact,
        COUNT(*) FILTER (WHERE lead_time IS NULL OR TRIM(COALESCE(lead_time::text, '')) = '') AS missing_lead_time,
        COUNT(*) FILTER (WHERE contingency_plan IS NULL OR TRIM(COALESCE(contingency_plan::text, '')) = '') AS missing_contingency
      FROM items
    `);
  } else {
    itemsRes = { rows: [{ total: 0, missing_any: 0, missing_category: 0, missing_impact: 0, missing_lead_time: 0, missing_contingency: 0 }] } as any;
  }

  const incidentItemCol = pickColumn(incidentColumns, ['item_name', 'item', 'itemname', 'item_name_text', 'itemName']);
  const incidentLocationCol = pickColumn(incidentColumns, ['location', 'local', 'store_location']);
  const incidentDescriptionCol = pickColumn(incidentColumns, ['description', 'details', 'descricao']);
  const incidentMissingConditions: string[] = [];
  if (incidentItemCol) incidentMissingConditions.push(`${incidentItemCol} IS NULL OR TRIM(COALESCE(${incidentItemCol}::text, '')) = ''`);
  if (incidentLocationCol) incidentMissingConditions.push(`${incidentLocationCol} IS NULL OR TRIM(COALESCE(${incidentLocationCol}::text, '')) = ''`);
  if (incidentDescriptionCol) incidentMissingConditions.push(`${incidentDescriptionCol} IS NULL OR TRIM(COALESCE(${incidentDescriptionCol}::text, '')) = ''`);
  const incidentsRes = await pool.query(buildMissingQuery('incidents', incidentMissingConditions));

  const warrantyItemCol = pickColumn(warrantyColumns, ['item_name', 'item', 'itemname', 'item_name_text', 'itemName']);
  const warrantyStoreCol = pickColumn(warrantyColumns, ['store_location', 'store', 'location', 'storeLocation']);
  const warrantyPurchaseCol = pickColumn(warrantyColumns, ['purchase_date', 'purchaseDate']);
  const warrantyEndCol = pickColumn(warrantyColumns, ['warranty_end_date', 'warrantyEndDate', 'end_date']);
  const warrantySupplierCol = pickColumn(warrantyColumns, ['supplier_id', 'supplierId']);
  const warrantyMissingConditions: string[] = [];
  if (warrantyItemCol) warrantyMissingConditions.push(`${warrantyItemCol} IS NULL OR TRIM(COALESCE(${warrantyItemCol}::text, '')) = ''`);
  if (warrantyStoreCol) warrantyMissingConditions.push(`${warrantyStoreCol} IS NULL OR TRIM(COALESCE(${warrantyStoreCol}::text, '')) = ''`);
  if (warrantyPurchaseCol) warrantyMissingConditions.push(`${warrantyPurchaseCol} IS NULL`);
  if (warrantyEndCol) warrantyMissingConditions.push(`${warrantyEndCol} IS NULL`);
  if (warrantySupplierCol) warrantyMissingConditions.push(`${warrantySupplierCol} IS NULL OR TRIM(COALESCE(${warrantySupplierCol}::text, '')) = ''`);
  const warrantyRes = await pool.query(buildMissingQuery('warranty_items', warrantyMissingConditions));

  let toolsRes;
  if (toolsColumns.size > 0) {
    toolsRes = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (
          WHERE name IS NULL OR TRIM(COALESCE(name::text, '')) = ''
            OR category IS NULL OR TRIM(COALESCE(category::text, '')) = ''
            OR purchase_date IS NULL
        ) AS missing_any
      FROM tools
    `);
  } else {
    toolsRes = { rows: [{ total: 0, missing_any: 0 }] } as any;
  }

  let assetsRes;
  if (assetInventoryColumns.size > 0) {
    assetsRes = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (
          WHERE name IS NULL OR TRIM(COALESCE(name::text, '')) = ''
            OR store_name IS NULL OR TRIM(COALESCE(store_name::text, '')) = ''
        ) AS missing_any
      FROM asset_inventory
    `);
  } else {
    assetsRes = { rows: [{ total: 0, missing_any: 0 }] } as any;
  }

  let settlementsRes;
  if (settlementLettersColumns.size > 0) {
    settlementsRes = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (
          WHERE title IS NULL OR TRIM(COALESCE(title::text, '')) = ''
            OR supplier_id IS NULL OR TRIM(COALESCE(supplier_id::text, '')) = ''
            OR period_start_date IS NULL
            OR period_end_date IS NULL
        ) AS missing_any
      FROM settlement_letters
    `);
  } else {
    settlementsRes = { rows: [{ total: 0, missing_any: 0 }] } as any;
  }

  let storesRes;
  if (hasStoreLat && hasStoreLng) {
    storesRes = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (
            WHERE name IS NULL OR TRIM(COALESCE(name::text, '')) = ''
            OR location IS NULL OR TRIM(COALESCE(location::text, '')) = ''
            OR lat IS NULL OR lng IS NULL OR lat = 0 OR lng = 0
        ) AS missing_any,
        COUNT(*) FILTER (WHERE lat IS NULL OR lng IS NULL OR lat = 0 OR lng = 0) AS missing_geo
      FROM stores
    `);
  } else {
    storesRes = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (
            WHERE name IS NULL OR TRIM(COALESCE(name::text, '')) = ''
            OR location IS NULL OR TRIM(COALESCE(location::text, '')) = ''
        ) AS missing_any
      FROM stores
    `);
  }

  const suppliers = suppliersRes.rows[0] as CountRow;
  const items = itemsRes.rows[0] as CountRow & {
    missing_category: number;
    missing_impact: number;
    missing_lead_time: number;
    missing_contingency: number;
  };
  const incidents = incidentsRes.rows[0] as CountRow;
  const warranty = warrantyRes.rows[0] as CountRow;
  const tools = toolsRes.rows[0] as CountRow;
  const assets = assetsRes.rows[0] as CountRow;
  const settlements = settlementsRes.rows[0] as CountRow;
  const stores = storesRes.rows[0] as CountRow & { missing_geo?: number };

  const totalItems = toNumber(items.total);
  const itemsOk = Math.max(0, totalItems - toNumber(items.missing_any));
  const itemsPct = totalItems > 0 ? (itemsOk / totalItems) * 100 : 100;

  const totalSuppliers = toNumber(suppliers.total);
  const suppliersOk = Math.max(0, totalSuppliers - toNumber(suppliers.missing_any));
  const suppliersPct = totalSuppliers > 0 ? (suppliersOk / totalSuppliers) * 100 : 100;

  const totalStores = toNumber(stores.total);
  const missingGeo = toNumber(stores.missing_geo ?? 0);
  const storesGeoPct = totalStores > 0 ? ((totalStores - missingGeo) / totalStores) * 100 : 100;

  const metrics: DataQualityMetric[] = [
    {
      label: 'Itens com cadastro completo',
      value: formatPct(itemsPct),
      detail: `${itemsOk} de ${totalItems} itens com curva, categoria e parâmetros preenchidos.`,
    },
    {
      label: 'Fornecedores completos',
      value: formatPct(suppliersPct),
      detail: `${suppliersOk} de ${totalSuppliers} fornecedores com contato, email, CNPJ e especialidade.`,
    },
    {
      label: 'Lojas georreferenciadas',
      value: formatPct(storesGeoPct),
      detail: `${Math.max(0, totalStores - missingGeo)} de ${totalStores} lojas com lat/lng válidos.`,
    },
  ];

  const alerts: DataQualityAlert[] = [
    {
      id: 'items-missing-category',
      title: 'Itens sem categoria',
      detail: `${toNumber(items.missing_category)} itens aguardam classificação.`,
      severity: (toNumber(items.missing_category) > 25 ? 'critical' : 'warning') as DataQualityAlert['severity'],
    },
    {
      id: 'items-missing-impact',
      title: 'Itens sem fatores de impacto',
      detail: `${toNumber(items.missing_impact)} itens sem fatores de impacto definidos.`,
      severity: (toNumber(items.missing_impact) > 25 ? 'critical' : 'warning') as DataQualityAlert['severity'],
    },
    {
      id: 'stores-missing-geo',
      title: 'Lojas sem geolocalização',
      detail: `${missingGeo} lojas sem coordenadas válidas.`,
      severity: (missingGeo > 10 ? 'warning' : 'info') as DataQualityAlert['severity'],
    },
    {
      id: 'warranty-missing',
      title: 'Garantias incompletas',
      detail: `${toNumber(warranty.missing_any)} registros de garantia com campos pendentes.`,
      severity: (toNumber(warranty.missing_any) > 0 ? 'warning' : 'info') as DataQualityAlert['severity'],
    },
    {
      id: 'incidents-missing',
      title: 'Incidentes sem detalhes completos',
      detail: `${toNumber(incidents.missing_any)} incidentes precisam de descrição ou localização.`,
      severity: (toNumber(incidents.missing_any) > 0 ? 'warning' : 'info') as DataQualityAlert['severity'],
    },
  ].filter(alert => !alert.detail.startsWith('0'));

  const incidentDetailCol = incidentItemCol || incidentDescriptionCol || incidentLocationCol;
  const incidentDetailSelect = incidentDetailCol ? `${incidentDetailCol} AS detail` : `NULL::text AS detail`;
  const incidentCreatedCol = pickColumn(incidentColumns, ['opened_at', 'created_at', 'createdat', 'openedat']);
  const incidentCreatedSelect = incidentCreatedCol ? `${incidentCreatedCol} AS created_at` : `now() AS created_at`;
  let activityRes;
  const activityQueries: string[] = [];
  if (incidentColumns.size > 0) {
    activityQueries.push(`SELECT 'Incidente registrado' AS title, ${incidentDetailSelect}, ${incidentCreatedSelect} FROM incidents`);
  }
  if (toolsColumns.size > 0) {
    activityQueries.push(`SELECT 'Ferramenta cadastrada' AS title, name AS detail, created_at AS created_at FROM tools`);
  }
  if (assetInventoryColumns.size > 0) {
    activityQueries.push(`SELECT 'Ativo cadastrado' AS title, name AS detail, created_at AS created_at FROM asset_inventory`);
  }
  if (settlementLettersColumns.size > 0) {
    activityQueries.push(`SELECT 'Solicitação de quitação' AS title, title AS detail, date AS created_at FROM settlement_letters`);
  }
  if (technicalReportsColumns.size > 0) {
    activityQueries.push(`SELECT 'Laudo técnico' AS title, title AS detail, created_at AS created_at FROM technical_reports`);
  }

  if (activityQueries.length === 0) {
    activityRes = { rows: [] } as any;
  } else {
    const unionSql = activityQueries.join('\n      UNION ALL\n      ');
    activityRes = await pool.query(`
      SELECT title, detail, created_at
      FROM (
        ${unionSql}
      ) AS activity
      WHERE created_at IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 5
    `);
  }

  const activity: DataQualityActivity[] = activityRes.rows.map((row: any) => ({
    title: row.title || 'Registro atualizado',
    when: new Date(row.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
    detail: row.detail ? String(row.detail) : 'Sem detalhes',
    status: 'ok',
  }));

  return { metrics, alerts, activity };
}

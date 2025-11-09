const { Client } = require('pg');

function parsePeriod(content) {
  if (!content) return null;
  // Look for patterns like 'Período: 01/01/2025 a 31/01/2025'
  const periodMatch = content.match(/Per[ií]odo:\s*(\d{1,2}\/\d{1,2}\/\d{4})\s*(?:a|to)\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
  if (periodMatch) {
    return { start: periodMatch[1], end: periodMatch[2] };
  }
  // Try alternative: 'referente ao período de dd/mm/yyyy a dd/mm/yyyy'
  const alt = content.match(/(referente ao per[ií]odo de)\s*(\d{1,2}\/\d{1,2}\/\d{4})\s*(?:a|to)\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
  if (alt) return { start: alt[2], end: alt[3] };
  return null;
}

function parseSupplierName(content) {
  if (!content) return null;
  // Look for 'Fornecedor: Name' in content
  const m = content.match(/Fornecedor:\s*([^\n\r]+)/i);
  if (m) return m[1].trim();
  return null;
}

function toISODateFromDMY(dmy) {
  if (!dmy) return null;
  const parts = dmy.split('/').map(p => parseInt(p, 10));
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  // Create ISO string without timezone (T00:00:00Z)
  const iso = new Date(Date.UTC(y, m - 1, d)).toISOString();
  return iso;
}

async function main() {
  function parseArg(nameShort, nameLong) {
    const idxShort = process.argv.indexOf(nameShort);
    if (idxShort !== -1 && process.argv.length > idxShort + 1) return process.argv[idxShort + 1];
    const idxLong = process.argv.indexOf(nameLong);
    if (idxLong !== -1 && process.argv.length > idxLong + 1) return process.argv[idxLong + 1];
    return undefined;
  }

  const password = process.env.PGPASSWORD || parseArg('--password');
  if (!password) {
    console.error('ERRO: senha não fornecida. Defina PGPASSWORD ou passe --password');
    process.exit(1);
  }

  const client = new Client({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
    user: process.env.PGUSER || 'postgres',
    password,
    database: process.env.PGDATABASE || 'postgres',
  });

  await client.connect();
  console.log('Connected to Postgres');

  // 1) Add columns if not exists
  const alterSql = `
    ALTER TABLE settlement_letters
      ADD COLUMN IF NOT EXISTS supplier_id TEXT,
      ADD COLUMN IF NOT EXISTS period_start_date TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS period_end_date TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pendente',
      ADD COLUMN IF NOT EXISTS received_date TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS file_url TEXT;
  `;

  try {
    await client.query(alterSql);
    console.log('Ensured columns exist on settlement_letters');
  } catch (err) {
    console.error('Failed to ALTER TABLE settlement_letters:', err);
    await client.end();
    process.exit(1);
  }

  // 2) Select rows and try to populate supplier_id and period columns
  const res = await client.query('SELECT id, title, content, date FROM settlement_letters');
  console.log(`Found ${res.rowCount} settlement_letters rows`);

  let updated = 0;
  for (const row of res.rows) {
    const { id, content } = row;
    const supplierName = parseSupplierName(content);
    const period = parsePeriod(content);

    let supplierId = null;
    if (supplierName) {
      // Try exact match first, then ILIKE
      const s1 = await client.query('SELECT id FROM suppliers WHERE lower(name) = lower($1) LIMIT 1', [supplierName]);
      if (s1.rowCount > 0) supplierId = String(s1.rows[0].id);
      else {
        const s2 = await client.query('SELECT id FROM suppliers WHERE name ILIKE $1 LIMIT 1', [`%${supplierName}%`]);
        if (s2.rowCount > 0) supplierId = String(s2.rows[0].id);
      }
    }

    const updates = [];
    const params = [];
    let idx = 1;
    if (supplierId) {
      updates.push(`supplier_id = $${idx++}`);
      params.push(supplierId);
    }
    if (period && period.start) {
      updates.push(`period_start_date = $${idx++}`);
      params.push(toISODateFromDMY(period.start));
    }
    if (period && period.end) {
      updates.push(`period_end_date = $${idx++}`);
      params.push(toISODateFromDMY(period.end));
    }

    if (updates.length > 0) {
      params.push(id);
      const sql = `UPDATE settlement_letters SET ${updates.join(', ')} WHERE id = $${params.length}`;
      try {
        await client.query(sql, params);
        updated++;
      } catch (err) {
        console.error('Failed to update row', id, err);
      }
    }
  }

  console.log(`Updated ${updated} rows with supplier/period data`);
  await client.end();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

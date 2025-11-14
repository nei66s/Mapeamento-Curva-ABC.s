const { Client } = require('pg');

function toISODateFromDMY(dmy) {
  if (!dmy) return null;
  const parts = dmy.split('/').map(p => parseInt(p, 10));
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  return new Date(Date.UTC(y, m - 1, d)).toISOString();
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

  // Require explicit confirmation to run demo seeds to avoid accidental use in production
  const allowDemo = process.env.ALLOW_DEMO_SEEDS === '1' || process.argv.includes('--demo');
  if (!allowDemo) {
    console.log('Demo seed skipped: set ALLOW_DEMO_SEEDS=1 or pass --demo to run this script.');
    await client.end();
    process.exit(0);
  }

  // Ensure suppliers exist
  const suppliers = [
    { name: 'Fornecedor A LTDA', cnpj: '11.111.111/0001-11', contact: 'Contato A', email: 'a@fornecedor.com' },
    { name: 'Fornecedor B SA', cnpj: '22.222.222/0001-22', contact: 'Contato B', email: 'b@fornecedor.com' },
  ];

  for (const s of suppliers) {
    try {
      // Check if supplier exists by cnpj or name
      const exist = await client.query('SELECT id FROM suppliers WHERE cnpj = $1 OR name = $2 LIMIT 1', [s.cnpj, s.name]);
      if (exist.rowCount > 0) continue;
      await client.query(`INSERT INTO suppliers (name, contact, contact_email, cnpj, specialty) VALUES ($1,$2,$3,$4,$5)`, [s.name, s.contact, s.email, s.cnpj, 'Serviços']);
    } catch (err) {
      if (err.code === '42P01') {
        // table doesn't exist - create minimal one for test
        console.log('suppliers table missing, creating minimal suppliers table for test');
        await client.query(`CREATE TABLE IF NOT EXISTS suppliers (id SERIAL PRIMARY KEY, name TEXT, contact TEXT, contact_email TEXT, cnpj TEXT, specialty TEXT)`);
        await client.query(`INSERT INTO suppliers (name, contact, contact_email, cnpj, specialty) VALUES ($1,$2,$3,$4,$5)`, [s.name, s.contact, s.email, s.cnpj, 'Serviços']);
      } else {
        console.error('Error inserting supplier', err.message || err);
      }
    }
  }

  // Fetch supplier names/ids for use in settlement content
  const sres = await client.query('SELECT id, name FROM suppliers ORDER BY name ASC LIMIT 2');
  const supRows = sres.rows;
  if (supRows.length === 0) {
    console.error('No suppliers available to reference. Aborting.');
    await client.end();
    process.exit(1);
  }

  // Insert sample settlement_letters
  const now = new Date();
  const inserts = [
    {
      id: 'SL-TEST-001',
      title: 'CT-2025-001',
      description: 'Serviço de manutenção concluído conforme escopo.',
      supplierName: supRows[0].name,
      periodStart: '01/09/2025',
      periodEnd: '30/09/2025',
    },
    {
      id: 'SL-TEST-002',
      title: 'CT-2025-002',
      description: 'Fornecimento e instalação de equipamento X.',
      supplierName: supRows[1] ? supRows[1].name : supRows[0].name,
      periodStart: '01/10/2025',
      periodEnd: '15/10/2025',
    },
  ];

  // Determine settlement_letters.id column type
  let idIsInteger = false;
  try {
    const col = await client.query("SELECT data_type FROM information_schema.columns WHERE table_name='settlement_letters' AND column_name='id'");
    if (col.rowCount > 0) {
      const dt = col.rows[0].data_type || '';
      if (dt.includes('int')) idIsInteger = true;
    }
  } catch (err) {
    // ignore
  }

  for (const it of inserts) {
    const content = `${it.description}\n\nFornecedor: ${it.supplierName}\n\nPeríodo: ${it.periodStart} a ${it.periodEnd}`;
    try {
      if (idIsInteger) {
        // insert without id, let DB assign integer id
        await client.query(`INSERT INTO settlement_letters (title, content, date) VALUES ($1,$2,$3)`, [it.title, content, now]);
      } else {
        await client.query(`INSERT INTO settlement_letters (id, title, content, date) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING`, [it.id, it.title, content, now]);
      }
    } catch (err) {
      if (err.code === '42P01') {
        // table doesn't exist - create minimal table for test with text id
        console.log('settlement_letters table missing, creating minimal table for test');
        await client.query(`CREATE TABLE IF NOT EXISTS settlement_letters (id TEXT PRIMARY KEY, title TEXT, content TEXT, date TIMESTAMPTZ)`);
        await client.query(`INSERT INTO settlement_letters (id, title, content, date) VALUES ($1,$2,$3,$4)`, [it.id, it.title, content, now]);
      } else {
        console.error('Error inserting settlement_letter', err.message || err);
      }
    }
  }

  console.log('Inserted sample settlement_letters. Now populating structured fields...');

  // Now run the migration steps inline: add columns if not exists and populate from content
  const alterSql = `
    ALTER TABLE settlement_letters
      ADD COLUMN IF NOT EXISTS supplier_id TEXT,
      ADD COLUMN IF NOT EXISTS period_start_date TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS period_end_date TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pendente',
      ADD COLUMN IF NOT EXISTS received_date TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS file_url TEXT;
  `;
  await client.query(alterSql);

  const rows = await client.query('SELECT id, content FROM settlement_letters');
  let updated = 0;
  for (const r of rows.rows) {
    const { id, content } = r;
    const mSup = content.match(/Fornecedor:\s*([^\n\r]+)/i);
    const mPeriod = content.match(/Per[ií]odo:\s*(\d{1,2}\/\d{1,2}\/\d{4})\s*(?:a|to)\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
    let supplierId = null;
    if (mSup) {
      const name = mSup[1].trim();
      const s1 = await client.query('SELECT id FROM suppliers WHERE lower(name) = lower($1) LIMIT 1', [name]);
      if (s1.rowCount > 0) supplierId = String(s1.rows[0].id);
      else {
        const s2 = await client.query('SELECT id FROM suppliers WHERE name ILIKE $1 LIMIT 1', [`%${name}%`]);
        if (s2.rowCount > 0) supplierId = String(s2.rows[0].id);
      }
    }
    const updates = [];
    const params = [];
    if (supplierId) {
      params.push(supplierId);
      updates.push(`supplier_id = $${params.length}`);
    }
    if (mPeriod) {
      params.push(toISODateFromDMY(mPeriod[1]));
      updates.push(`period_start_date = $${params.length}`);
      params.push(toISODateFromDMY(mPeriod[2]));
      updates.push(`period_end_date = $${params.length}`);
    }
    if (updates.length > 0) {
      params.push(id);
      const sql = `UPDATE settlement_letters SET ${updates.join(', ')} WHERE id = $${params.length}`;
      await client.query(sql, params);
      updated++;
    }
  }

  console.log(`Populated structured fields for ${updated} rows`);

  const final = await client.query('SELECT id, title, supplier_id, period_start_date, period_end_date, status FROM settlement_letters ORDER BY id');
  console.table(final.rows);

  await client.end();
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
